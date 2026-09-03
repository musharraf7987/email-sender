'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Mail,
  Paperclip,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { TemplatesPasswordGate } from '@/components/templates-password-gate';
import {
  deleteTemplate,
  fetchTemplates,
  saveTemplate,
} from '@/hooks/use-api';
import { applyTemplate, TEMPLATE_PLACEHOLDER } from '@/lib/template-utils';
import type { EmailTemplate } from '@/types';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FormState = {
  name: string;
  jobType: string;
  subject: string;
  body: string;
};

const emptyForm: FormState = {
  name: '',
  jobType: '',
  subject: `Application for ${TEMPLATE_PLACEHOLDER}`,
  body: '',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [previewJobTitle, setPreviewJobTitle] = useState('React Developer');
  const [cvOpen, setCvOpen] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await fetchTemplates();
      setTemplates(loaded);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load templates',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPreviewJobTitle('React Developer');
    setEditorOpen(true);
    setMessage(null);
  };

  const openEdit = (template: EmailTemplate) => {
    setEditingId(template.id);
    setForm({
      name: template.name,
      jobType: template.jobType,
      subject: template.subject,
      body: template.body,
    });
    setPreviewJobTitle(template.jobType);
    setEditorOpen(true);
    setMessage(null);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.jobType.trim() || !form.subject.trim() || !form.body.trim()) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await saveTemplate(form, editingId);
      setMessage({
        type: 'success',
        text: editingId ? 'Template updated successfully' : 'Template created successfully',
      });
      closeEditor();
      await loadTemplates();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save template',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (template: EmailTemplate) => {
    setDeletingTemplate(template);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    setSaving(true);
    try {
      await deleteTemplate(deletingTemplate.id);
      setMessage({ type: 'success', text: 'Template deleted successfully' });
      setDeleteOpen(false);
      setDeletingTemplate(null);
      await loadTemplates();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete template',
      });
    } finally {
      setSaving(false);
    }
  };

  const previewSubject = applyTemplate(form.subject, { jobTitle: previewJobTitle });
  const previewBody = applyTemplate(form.body, { jobTitle: previewJobTitle });

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/50 via-background to-background">
      <AppHeader
        title="Email Templates"
        subtitle={`Use ${TEMPLATE_PLACEHOLDER} for dynamic job title`}
        icon={<FileText className="h-4 w-4 text-primary" />}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Template</span>
          </Button>
        }
      />

      <TemplatesPasswordGate>
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        {/* CV Viewer */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader
            className="cursor-pointer select-none pb-4"
            onClick={() => setCvOpen((prev) => !prev)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                  <Paperclip className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">CV / Resume Preview</CardTitle>
                  <CardDescription className="text-xs">
                    This is the file currently attached to all outgoing application emails
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0" tabIndex={-1}>
                {cvOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {cvOpen ? 'Hide' : 'View CV'}
              </Button>
            </div>
          </CardHeader>
          {cvOpen && (
            <CardContent className="pt-0">
              <div className="overflow-hidden rounded-lg border border-border/60">
                <iframe
                  src="/Musharraf-CV.pdf"
                  title="CV Preview"
                  className="h-[80vh] w-full"
                />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                To update, replace <code className="rounded bg-muted px-1 py-0.5 font-mono">public/Musharraf-CV.pdf</code> with your new PDF
              </p>
            </CardContent>
          )}
        </Card>

        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="flex flex-1 flex-col border-border/60 bg-card/50">
            <CardContent className="flex flex-1 flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No templates yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create your first email template to start sending tailored job applications
              </p>
              <Button onClick={openCreate} className="mt-6">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="flex flex-col border-border/60 bg-card/50 transition-colors hover:bg-card/80"
              >
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Default: {template.jobType}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Template
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      Subject preview
                    </div>
                    <p className="text-sm font-medium leading-snug">
                      {applyTemplate(template.subject, { jobTitle: template.jobType })}
                    </p>
                  </div>
                  <div className="flex-1 rounded-lg border border-border/60 bg-muted/20 p-4">
                    <p className="mb-2 text-xs text-muted-foreground">Body preview</p>
                    <pre className="line-clamp-6 whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground/80">
                      {applyTemplate(template.body, { jobTitle: template.jobType })}
                    </pre>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(template)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDelete(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={editorOpen} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="flex h-[95vh] max-h-[900px] w-[95vw] max-w-[1400px] flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="shrink-0 border-b border-border/40 px-6 py-4">
            <DialogTitle>{editingId ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              Use {TEMPLATE_PLACEHOLDER} in subject or body — replaced with job title when sending.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 lg:grid-cols-2">
            {/* Left — Form */}
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-b border-border/40 p-6 lg:border-b-0 lg:border-r">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="React Developer"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobType">Default Job Title</Label>
                  <Input
                    id="jobType"
                    value={form.jobType}
                    onChange={(e) => {
                      setForm({ ...form, jobType: e.target.value });
                      if (!previewJobTitle || previewJobTitle === form.jobType) {
                        setPreviewJobTitle(e.target.value);
                      }
                    }}
                    placeholder="React Developer"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={`Application for ${TEMPLATE_PLACEHOLDER}`}
                  disabled={saving}
                />
              </div>

              <div className="flex min-h-0 flex-1 flex-col space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Name: Your Name&#10;Experience: ..."
                  disabled={saving}
                  className="min-h-[280px] flex-1 resize-none font-mono text-sm lg:min-h-0"
                />
              </div>
            </div>

            {/* Right — Live Preview */}
            <div className="flex min-h-0 flex-col bg-muted/20">
              <div className="shrink-0 border-b border-border/40 px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Live Preview</p>
                    <p className="text-xs text-muted-foreground">Updates as you type</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="previewJobTitle" className="shrink-0 text-xs text-muted-foreground">
                      Job title:
                    </Label>
                    <Input
                      id="previewJobTitle"
                      value={previewJobTitle}
                      onChange={(e) => setPreviewJobTitle(e.target.value)}
                      placeholder="React JS Developer"
                      disabled={saving}
                      className="h-8 max-w-[220px] text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6 pt-4">
                <div className="space-y-3 rounded-lg border border-border/60 bg-background/80 p-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Subject: </span>
                    <span className="font-semibold">{previewSubject || '—'}</span>
                  </div>
                </div>
                <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-lg border border-border/60 bg-background/80">
                  <div className="shrink-0 border-b border-border/40 px-4 py-2 text-xs text-muted-foreground">
                    Email body
                  </div>
                  <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap p-4 font-sans text-sm leading-relaxed text-foreground/90">
                    {previewBody || 'Start typing body to see preview…'}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/40 px-6 py-4 sm:gap-0">
            <Button variant="outline" onClick={closeEditor} disabled={saving}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{deletingTemplate?.name}&quot;. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TemplatesPasswordGate>
    </div>
  );
}
