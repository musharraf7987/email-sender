'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  LayoutList,
  Loader2,
  Mail,
  Paperclip,
  Phone,
  Plus,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import { applyTemplate } from '@/lib/template-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type DuplicateApp = {
  email: string;
  jobType: string;
  status: string;
  appliedAt: string;
  companyName: string | null;
};

type EmailTemplate = {
  id: string;
  name: string;
  jobType: string;
  subject: string;
  body: string;
};

const formatAppliedDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function Home() {
  const [emails, setEmails] = useState<string[]>(['']);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateId, setTemplateId] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [results, setResults] = useState<Array<{ email: string; success: boolean; message: string }>>([]);
  const [duplicates, setDuplicates] = useState<DuplicateApp[]>([]);
  const [duplicateDecisions, setDuplicateDecisions] = useState<Record<string, 'apply' | 'discard'>>({});
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? null,
    [templates, templateId]
  );

  const previewSubject = useMemo(() => {
    if (!selectedTemplate) return '';
    return applyTemplate(selectedTemplate.subject, { jobTitle: selectedTemplate.jobType });
  }, [selectedTemplate]);

  const previewBody = useMemo(() => {
    if (!selectedTemplate) return '';
    return applyTemplate(selectedTemplate.body, { jobTitle: selectedTemplate.jobType });
  }, [selectedTemplate]);

  const validEmailCount = useMemo(
    () => emails.filter((email) => email.trim().length > 0).length,
    [emails]
  );

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success && Array.isArray(data.templates) && data.templates.length > 0) {
        setTemplates(data.templates);
        setTemplateId((data.templates[0] as EmailTemplate).id);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load email templates' });
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
  };

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const sendEmails = async (emailsToSend: string[]) => {
    if (emailsToSend.length === 0) {
      setMessage({ type: 'error', text: 'No emails left to send. Discarded already-applied addresses.' });
      setLoading(false);
      return;
    }

    if (!templateId) {
      setMessage({ type: 'error', text: 'Please select an email template' });
      setLoading(false);
      return;
    }

    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      setMessage({ type: 'error', text: 'Please select an email template' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailsToSend,
          templateId,
          jobTitle: template.jobType,
          recruiterPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
        const successCount = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
        const totalCount = data.results?.length || 0;

        if (successCount === totalCount) {
          setMessage({ type: 'success', text: `All ${totalCount} email(s) sent successfully!` });
        } else {
          setMessage({
            type: 'error',
            text: `${successCount} of ${totalCount} email(s) sent successfully. Some failed.`,
          });
        }

        setEmails(['']);
        setRecruiterPhone('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send emails' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setResults([]);

    const emailsToSend = [
      ...new Set(emails.map((email) => email.trim().toLowerCase()).filter((email) => email.length > 0)),
    ];

    if (emailsToSend.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one email address' });
      setLoading(false);
      return;
    }

    if (!templateId) {
      setMessage({ type: 'error', text: 'Please select an email template' });
      setLoading(false);
      return;
    }

    try {
      const checkResponse = await fetch('/api/applications/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailsToSend }),
      });
      const checkData = await checkResponse.json();

      if (!checkResponse.ok || !checkData.success) {
        setMessage({ type: 'error', text: checkData.error || 'Failed to check previous applications' });
        setLoading(false);
        return;
      }

      const found: DuplicateApp[] = checkData.duplicates || [];
      if (found.length > 0) {
        setPendingEmails(emailsToSend);
        setDuplicates(found);
        setDuplicateDecisions({});
        setDialogOpen(true);
        setLoading(false);
        return;
      }

      await sendEmails(emailsToSend);
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setLoading(false);
    }
  };

  const finishDuplicates = async (decisions: Record<string, 'apply' | 'discard'>) => {
    const discarded = new Set(
      Object.entries(decisions)
        .filter(([, decision]) => decision === 'discard')
        .map(([email]) => email)
    );
    const emailsToSend = pendingEmails.filter((email) => !discarded.has(email));
    setDialogOpen(false);
    setDuplicates([]);
    setPendingEmails([]);
    setDuplicateDecisions({});
    setLoading(true);
    setMessage(null);
    await sendEmails(emailsToSend);
  };

  const decideDuplicate = (email: string, decision: 'apply' | 'discard') => {
    const next = { ...duplicateDecisions, [email]: decision };
    setDuplicateDecisions(next);
    const allDecided = duplicates.every((item) => next[item.email]);
    if (allDecided) {
      void finishDuplicates(next);
    }
  };

  const cancelDuplicates = () => {
    setDialogOpen(false);
    setDuplicates([]);
    setPendingEmails([]);
    setDuplicateDecisions({});
  };

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/50 via-background to-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Send className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight sm:text-lg">Job Application Sender</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Send tailored applications with CV</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/templates">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/applications">
                <LayoutList className="h-4 w-4" />
                <span className="hidden sm:inline">Tracker</span>
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:gap-8 lg:p-8">
        {/* Left Panel — Form */}
        <div className="flex w-full flex-col gap-6 lg:w-[420px] lg:shrink-0 xl:w-[460px]">
          {/* Profile Card */}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Musharraf Ansari</p>
                <a
                  href="mailto:musharraf.code@gmail.com"
                  className="flex items-center gap-1.5 truncate text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  musharraf.code@gmail.com
                </a>
              </div>
              <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                <Paperclip className="mr-1 h-3 w-3" />
                CV attached
              </Badge>
            </CardContent>
          </Card>

          {/* Send Form */}
          <Card className="flex-1 border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Compose Application</CardTitle>
              <CardDescription>
                Fill details below and preview your email on the right
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="space-y-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No email templates found.</p>
                  <Button asChild>
                    <Link href="/templates">Create Template</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Recruiter Email(s)
                    </Label>
                    <div className="space-y-2">
                      {emails.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => updateEmail(index, e.target.value)}
                            placeholder="recruiter@company.com"
                            disabled={loading}
                            className="min-w-0"
                          />
                          {index === emails.length - 1 ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={addEmailField}
                              disabled={loading}
                              title="Add another email"
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeEmailField(index)}
                              disabled={loading}
                              title="Remove this email"
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {validEmailCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {validEmailCount} recipient{validEmailCount > 1 ? 's' : ''} added
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recruiterPhone" className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Recruiter Phone
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="recruiterPhone"
                      type="tel"
                      value={recruiterPhone}
                      onChange={(e) => setRecruiterPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      disabled={loading}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="template" className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      Email Template
                    </Label>
                    <Select value={templateId} onValueChange={handleTemplateChange} disabled={loading}>
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading || emails.every((email) => !email.trim()) || !templateId}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Application{validEmailCount > 1 ? 's' : ''}
                        {validEmailCount > 0 && ` (${validEmailCount})`}
                      </>
                    )}
                  </Button>
                </form>
              )}

              {message && (
                <Alert
                  variant={message.type === 'success' ? 'success' : 'destructive'}
                  className="mt-5"
                >
                  {message.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results — mobile / sidebar */}
          {results.length > 0 && (
            <Card className="border-border/60 lg:hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Send Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      result.success
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                    }`}
                  >
                    <span className="font-medium">{result.email}:</span> {result.message}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel — Live Preview */}
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <Card className="flex flex-1 flex-col border-border/60">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Email Preview</CardTitle>
                  <CardDescription className="mt-1">
                    Live preview — updates when you change template
                  </CardDescription>
                </div>
                {selectedTemplate && (
                  <Badge variant="secondary">{selectedTemplate.name}</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col p-0">
              {!selectedTemplate ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                    <Mail className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select a template to see preview
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col">
                  {/* Email header mockup */}
                  <div className="space-y-3 border-b border-border/40 bg-muted/20 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">From: </span>
                        <span className="font-medium">Musharraf &lt;musharraf.code@gmail.com&gt;</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To: </span>
                        <span>
                          {validEmailCount > 0
                            ? emails.filter((e) => e.trim()).join(', ')
                            : 'recruiter@company.com'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Subject: </span>
                      <span className="font-semibold text-foreground">{previewSubject}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5" />
                      Musharraf-CV.pdf
                    </div>
                  </div>

                  {/* Email body */}
                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                      {previewBody}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results — desktop */}
          {results.length > 0 && (
            <Card className="hidden border-border/60 lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Send Results</CardTitle>
                <CardDescription>
                  {results.filter((r) => r.success).length} of {results.length} sent successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`rounded-md border px-3 py-2.5 text-sm ${
                        result.success
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-red-500/30 bg-red-500/10 text-red-300'
                      }`}
                    >
                      <span className="font-medium">{result.email}</span>
                      <p className="mt-0.5 text-xs opacity-80">{result.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && cancelDuplicates()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Already applied</DialogTitle>
            <DialogDescription>
              You have already applied to {duplicates.length === 1 ? 'this email' : 'these emails'}.
              Choose apply again or discard for each one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {duplicates.map((item) => {
              const decision = duplicateDecisions[item.email];
              return (
                <div key={item.email} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="break-all text-sm font-medium">{item.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Applied on {formatAppliedDate(item.appliedAt)}
                    {item.jobType ? ` as ${item.jobType}` : ''}
                    {item.status ? ` · ${item.status}` : ''}
                    {item.companyName ? ` · ${item.companyName}` : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={decision === 'apply' ? 'default' : 'outline'}
                      onClick={() => decideDuplicate(item.email, 'apply')}
                    >
                      Apply again
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={decision === 'discard' ? 'destructive' : 'outline'}
                      onClick={() => decideDuplicate(item.email, 'discard')}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
