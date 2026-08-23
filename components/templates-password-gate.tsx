'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Delete, FileText, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TEMPLATES_PIN_LENGTH } from '@/lib/templates-auth.constants';
import { cn } from '@/lib/utils';

type AuthStatus = {
  authenticated: boolean;
  protected: boolean;
};

async function fetchAuthStatus(): Promise<AuthStatus> {
  const response = await fetch('/api/templates/auth');
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to check access');
  return { authenticated: data.authenticated, protected: data.protected };
}

async function unlockTemplates(password: string): Promise<void> {
  const response = await fetch('/api/templates/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Incorrect PIN');
  }
}

function PinDots({ filled, shake }: { filled: number; shake: boolean }) {
  return (
    <div className={cn('flex justify-center gap-3 py-2', shake && 'animate-shake')}>
      {Array.from({ length: TEMPLATES_PIN_LENGTH }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-3.5 w-3.5 rounded-full border-2 transition-all duration-150 sm:h-4 sm:w-4',
            index < filled
              ? 'scale-110 border-primary bg-primary'
              : 'border-muted-foreground/35 bg-transparent'
          )}
        />
      ))}
    </div>
  );
}

type NumKeypadProps = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  canSubmit: boolean;
};

function NumKeypad({ onDigit, onBackspace, onSubmit, disabled, canSubmit }: NumKeypadProps) {
  const keys: Array<{ label: string; action: 'digit' | 'back' | 'submit'; value?: string }> = [
    { label: '1', action: 'digit', value: '1' },
    { label: '2', action: 'digit', value: '2' },
    { label: '3', action: 'digit', value: '3' },
    { label: '4', action: 'digit', value: '4' },
    { label: '5', action: 'digit', value: '5' },
    { label: '6', action: 'digit', value: '6' },
    { label: '7', action: 'digit', value: '7' },
    { label: '8', action: 'digit', value: '8' },
    { label: '9', action: 'digit', value: '9' },
    { label: '⌫', action: 'back' },
    { label: '0', action: 'digit', value: '0' },
    { label: '✓', action: 'submit' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {keys.map((key) => (
        <Button
          key={key.label}
          type="button"
          variant={key.action === 'submit' ? 'default' : 'outline'}
          disabled={
            disabled ||
            (key.action === 'submit' && !canSubmit) ||
            (key.action === 'back' && disabled)
          }
          className={cn(
            'h-14 touch-manipulation text-xl font-semibold sm:h-16 sm:text-2xl',
            key.action === 'back' && 'text-base sm:text-lg',
            key.action === 'submit' && 'text-lg sm:text-xl'
          )}
          onClick={() => {
            if (key.action === 'digit' && key.value) onDigit(key.value);
            if (key.action === 'back') onBackspace();
            if (key.action === 'submit') onSubmit();
          }}
        >
          {key.action === 'back' ? <Delete className="h-5 w-5 sm:h-6 sm:w-6" /> : key.label}
        </Button>
      ))}
    </div>
  );
}

type PasswordFormProps = {
  onSuccess: () => void;
  title?: string;
  description?: string;
};

function PasswordForm({ onSuccess, title, description }: PasswordFormProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const submitPin = useCallback(
    async (value: string) => {
      if (value.length !== TEMPLATES_PIN_LENGTH || loading) return;

      setLoading(true);
      setError(null);
      try {
        await unlockTemplates(value);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Incorrect PIN');
        setShake(true);
        setPin('');
        setTimeout(() => setShake(false), 500);
      } finally {
        setLoading(false);
      }
    },
    [loading, onSuccess]
  );

  useEffect(() => {
    if (pin.length === TEMPLATES_PIN_LENGTH) {
      void submitPin(pin);
    }
  }, [pin, submitPin]);

  const addDigit = (digit: string) => {
    if (loading || pin.length >= TEMPLATES_PIN_LENGTH) return;
    setError(null);
    setPin((prev) => prev + digit);
  };

  const backspace = () => {
    if (loading) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="space-y-5">
      {(title || description) && (
        <div className="space-y-1 text-center">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className="space-y-3">
        <PinDots filled={pin.length} shake={shake} />
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </div>
        )}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </div>

      {/* Hidden input — mobile native numpad fallback */}
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className="sr-only"
        value={pin}
        readOnly
        aria-label="Templates PIN"
      />

      <NumKeypad
        onDigit={addDigit}
        onBackspace={backspace}
        onSubmit={() => void submitPin(pin)}
        disabled={loading}
        canSubmit={pin.length === TEMPLATES_PIN_LENGTH}
      />
    </div>
  );
}

export function TemplatesPasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);

  const refresh = useCallback(async () => {
    const next = await fetchAuthStatus();
    setStatus(next);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!status) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status.protected || status.authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm rounded-xl border border-border/60 bg-card/50 p-5 shadow-lg sm:max-w-md sm:p-8">
        <div className="mb-5 flex flex-col items-center gap-3 text-center sm:mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Templates Locked</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter {TEMPLATES_PIN_LENGTH}-digit PIN to manage templates
            </p>
          </div>
        </div>
        <PasswordForm onSuccess={refresh} />
      </div>
    </div>
  );
}

type TemplatesNavButtonProps = {
  variant?: 'default' | 'secondary' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
  alwaysShowLabel?: boolean;
  label?: string;
  onNavigate?: () => void;
};

export function TemplatesNavButton({
  variant = 'ghost',
  size = 'sm',
  className,
  showLabel = true,
  alwaysShowLabel = false,
  label = 'Templates',
  onNavigate,
}: TemplatesNavButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const goToTemplates = useCallback(async () => {
    setChecking(true);
    try {
      const status = await fetchAuthStatus();
      if (!status.protected || status.authenticated) {
        onNavigate?.();
        router.push('/templates');
        return;
      }
      onNavigate?.();
      setDialogOpen(true);
    } catch {
      onNavigate?.();
      setDialogOpen(true);
    } finally {
      setChecking(false);
    }
  }, [router, onNavigate]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => void goToTemplates()}
        disabled={checking}
      >
        {checking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {showLabel && (
          <span className={alwaysShowLabel ? '' : label !== 'Templates' ? '' : 'hidden sm:inline'}>
            {label}
          </span>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm gap-5 p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="text-center sm:text-left">
            <DialogTitle>Enter Templates PIN</DialogTitle>
            <DialogDescription>
              Enter your {TEMPLATES_PIN_LENGTH}-digit PIN using the keypad below
            </DialogDescription>
          </DialogHeader>
          <PasswordForm
            onSuccess={() => {
              setDialogOpen(false);
              router.push('/templates');
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
