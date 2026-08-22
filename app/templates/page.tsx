'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { applyTemplate, TEMPLATE_PLACEHOLDER } from '@/lib/template-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

type EmailTemplate = {
  id: string;
  name: string;
  jobType: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

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

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load templates' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

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
      const url = editingId ? `/api/templates/${editingId}` : '/api/templates';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: editingId ? 'Template updated successfully' : 'Template created successfully',
        });
        closeEditor();
        await fetchTemplates();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save template' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
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
      const response = await fetch(`/api/templates/${deletingTemplate.id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Template deleted successfully' });
        setDeleteOpen(false);
        setDeletingTemplate(null);
        await fetchTemplates();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete template' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const previewSubject = applyTemplate(form.subject, { jobTitle: previewJobTitle });
  const previewBody = applyTemplate(form.body, { jobTitle: previewJobTitle });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/60 via-background to-background p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Send
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and customize templates. Use {TEMPLATE_PLACEHOLDER} for dynamic job title.
            </p>
          </div>
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>

        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No templates yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first email template to get started
              </p>
              <Button onClick={openCreate} className="mt-4">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id} className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>
                    Default job title: {template.jobType}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
                    <p className="font-medium text-muted-foreground">Subject preview</p>
                    <p className="mt-1">
                      {applyTemplate(template.subject, { jobTitle: template.jobType })}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
      </div>

      <Dialog open={editorOpen} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              Use {TEMPLATE_PLACEHOLDER} in subject or body — it will be replaced with the job title when sending.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Name: Your Name&#10;Experience: ..."
                rows={10}
                disabled={saving}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="previewJobTitle">Preview with job title</Label>
                <Input
                  id="previewJobTitle"
                  value={previewJobTitle}
                  onChange={(e) => setPreviewJobTitle(e.target.value)}
                  placeholder="React JS Developer"
                  disabled={saving}
                  className="max-w-xs"
                />
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Subject: </span>
                  {previewSubject || '—'}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Body: </span>
                  <pre className="mt-1 whitespace-pre-wrap rounded-md bg-background/50 p-3 text-xs">
                    {previewBody || '—'}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
    </div>
  );
}
