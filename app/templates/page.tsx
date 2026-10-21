'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { TemplatesPasswordGate } from '@/components/templates-password-gate';
import {
  deleteResumeFile,
  deleteTemplate,
  fetchResumes,
  fetchTemplates,
  saveTemplate,
  setDefaultResume,
  uploadResumeFile,
} from '@/hooks/use-api';
import { applyTemplate, TEMPLATE_PLACEHOLDER } from '@/lib/template-utils';
import type { EmailTemplate, ResumeMeta } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FormState = {
  name: string;
  jobType: string;
  subject: string;
  body: string;
  resumeId: string | null;
};

const emptyForm: FormState = {
  name: '',
  jobType: '',
  subject: `Application for ${TEMPLATE_PLACEHOLDER}`,
  body: '',
  resumeId: null,
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [resumes, setResumes] = useState<ResumeMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [previewJobTitle, setPreviewJobTitle] = useState('React Developer');
  const [cvOpen, setCvOpen] = useState(true);
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);
  const globalFileRef = useRef<HTMLInputElement>(null);
  const templateFileRef = useRef<HTMLInputElement>(null);

  const defaultResume = useMemo(
    () => resumes.find((resume) => resume.isDefault) ?? resumes[0] ?? null,
    [resumes]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedTemplates, loadedResumes] = await Promise.all([
        fetchTemplates(),
        fetchResumes(),
      ]);
      setTemplates(loadedTemplates);
      setResumes(loadedResumes);
      const preferred =
        loadedResumes.find((resume) => resume.isDefault)?.id ?? loadedResumes[0]?.id ?? null;
      setPreviewResumeId((current) => current ?? preferred);
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
    void loadData();
  }, [loadData]);

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
      resumeId: template.resumeId ?? null,
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
      await loadData();
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
      await loadData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete template',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File | undefined, makeDefault: boolean, forTemplate = false) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const resume = await uploadResumeFile(file, makeDefault);
      const loadedResumes = await fetchResumes();
      setResumes(loadedResumes);
      setPreviewResumeId(resume.id);
      if (forTemplate) {
        setForm((prev) => ({ ...prev, resumeId: resume.id }));
      }
      setMessage({
        type: 'success',
        text: makeDefault
          ? `"${resume.name}" uploaded and set as default for all templates`
          : `"${resume.name}" uploaded`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload resume',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setUploading(true);
    try {
      await setDefaultResume(id);
      setResumes(await fetchResumes());
      setPreviewResumeId(id);
      setMessage({ type: 'success', text: 'Default resume updated for all templates' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to set default resume',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (id: string) => {
    setUploading(true);
    try {
      await deleteResumeFile(id);
      const loadedResumes = await fetchResumes();
      setResumes(loadedResumes);
      setPreviewResumeId(loadedResumes.find((r) => r.isDefault)?.id ?? loadedResumes[0]?.id ?? null);
      setForm((prev) => (prev.resumeId === id ? { ...prev, resumeId: null } : prev));
      await loadData();
      setMessage({ type: 'success', text: 'Resume deleted' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete resume',
      });
    } finally {
      setUploading(false);
    }
  };

  const previewSubject = applyTemplate(form.subject, { jobTitle: previewJobTitle });
  const previewBody = applyTemplate(form.body, { jobTitle: previewJobTitle });
  const selectedFormResume =
    form.resumeId != null ? resumes.find((resume) => resume.id === form.resumeId) : null;
  const activePreviewId = previewResumeId ?? defaultResume?.id ?? null;

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
                    <CardTitle className="text-base">Resumes</CardTitle>
                    <CardDescription className="text-xs">
                      Upload one default resume for all templates, or pick a different PDF per template
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0" tabIndex={-1}>
                  {cvOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {cvOpen ? 'Hide' : 'Manage'}
                </Button>
              </div>
            </CardHeader>

            {cvOpen && (
              <CardContent className="space-y-4 pt-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    {defaultResume ? (
                      <>
                        Default for all templates:{' '}
                        <span className="font-medium text-foreground">{defaultResume.name}</span>
                      </>
                    ) : (
                      'No default resume yet — upload one below'
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={globalFileRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        void handleUpload(file, true);
                      }}
                    />
                    <Button
                      size="sm"
                      disabled={uploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        globalFileRef.current?.click();
                      }}
                    >
                      {uploading ? <Loader2 className="animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload default resume
                    </Button>
                  </div>
                </div>

                {resumes.length > 0 && (
                  <div className="space-y-2">
                    {resumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setPreviewResumeId(resume.id)}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium">{resume.name}</p>
                            {resume.isDefault && <Badge variant="success">Default</Badge>}
                            {previewResumeId === resume.id && (
                              <Badge variant="outline">Previewing</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{formatSize(resume.size)}</p>
                        </button>
                        <div className="flex flex-wrap gap-2">
                          {!resume.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={uploading}
                              onClick={() => void handleSetDefault(resume.id)}
                            >
                              <Star className="h-4 w-4" />
                              Set default
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={uploading}
                            onClick={() => void handleDeleteResume(resume.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activePreviewId ? (
                  <div className="overflow-hidden rounded-lg border border-border/60">
                    <iframe
                      key={activePreviewId}
                      src={`/api/resumes/${activePreviewId}`}
                      title="Resume Preview"
                      className="h-[70vh] w-full"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
                    Upload a PDF resume to preview it here
                  </div>
                )}
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
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5" />
                        Resume
                      </div>
                      <p className="font-medium text-foreground">
                        {template.resume?.name ??
                          (defaultResume ? `${defaultResume.name} (default)` : 'No resume set')}
                      </p>
                    </div>
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

                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4">
                  <Label>Resume for this template</Label>
                  <p className="text-xs text-muted-foreground">
                    Leave as default to use the global resume, or choose / upload a specific PDF.
                  </p>
                  <Select
                    value={form.resumeId ?? 'default'}
                    onValueChange={(value) =>
                      setForm({ ...form, resumeId: value === 'default' ? null : value })
                    }
                    disabled={saving || uploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resume" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        Use global default
                        {defaultResume ? ` (${defaultResume.name})` : ''}
                      </SelectItem>
                      {resumes.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id}>
                          {resume.name}
                          {resume.isDefault ? ' · Default' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <input
                      ref={templateFileRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        void handleUpload(file, false, true);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={saving || uploading}
                      onClick={() => templateFileRef.current?.click()}
                    >
                      {uploading ? <Loader2 className="animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload for this template
                    </Button>
                    {selectedFormResume && (
                      <Badge variant="outline">{selectedFormResume.name}</Badge>
                    )}
                  </div>
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5" />
                      {selectedFormResume?.name ??
                        (defaultResume ? `${defaultResume.name} (default)` : 'No resume')}
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
                This will permanently delete &quot;{deletingTemplate?.name}&quot;. This action cannot be
                undone.
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
