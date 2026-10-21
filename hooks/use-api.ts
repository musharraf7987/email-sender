import type {
  ApiError,
  ApiSuccess,
  DuplicateApplication,
  EmailTemplate,
  PaginationMeta,
  ResumeMeta,
  SendEmailResult,
} from '@/types';

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export async function fetchTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch('/api/templates');
  const data = await parseJson<ApiSuccess<{ templates: EmailTemplate[] }> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
  return data.templates;
}

export async function saveTemplate(
  form: {
    name: string;
    jobType: string;
    subject: string;
    body: string;
    resumeId?: string | null;
  },
  editingId?: string | null
) {
  const url = editingId ? `/api/templates/${editingId}` : '/api/templates';
  const method = editingId ? 'PATCH' : 'POST';
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  const data = await parseJson<ApiSuccess<{ template: EmailTemplate }> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
  return data.template;
}

export async function fetchResumes(): Promise<ResumeMeta[]> {
  const response = await fetch('/api/resumes');
  const data = await parseJson<ApiSuccess<{ resumes: ResumeMeta[] }> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
  return data.resumes;
}

export async function uploadResumeFile(file: File, isDefault = false): Promise<ResumeMeta> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('isDefault', isDefault ? 'true' : 'false');

  const response = await fetch('/api/resumes', {
    method: 'POST',
    body: formData,
  });
  const data = await parseJson<ApiSuccess<{ resume: ResumeMeta }> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
  return data.resume;
}

export async function setDefaultResume(id: string): Promise<ResumeMeta> {
  const response = await fetch(`/api/resumes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isDefault: true }),
  });
  const data = await parseJson<ApiSuccess<{ resume: ResumeMeta }> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
  return data.resume;
}

export async function deleteResumeFile(id: string) {
  const response = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
  const data = await parseJson<ApiSuccess<Record<string, never>> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
}

export async function deleteTemplate(id: string) {
  const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
  const data = await parseJson<ApiSuccess<Record<string, never>> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
}

export async function checkDuplicateEmails(emails: string[]): Promise<DuplicateApplication[]> {
  const response = await fetch('/api/applications/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emails }),
  });
  const data = await parseJson<ApiSuccess<{ duplicates: DuplicateApplication[] }> | ApiError>(
    response
  );
  if (!response.ok || !data.success) throw new Error(data.success ? 'Request failed' : data.error);
  return data.duplicates;
}

export async function sendBulkEmails(payload: {
  emails: string[];
  templateId: string;
  jobTitle: string;
  recruiterPhone: string;
}): Promise<{ success: boolean; message: string; results: SendEmailResult[] }> {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<
    ApiSuccess<{ message: string; results: SendEmailResult[] }> & { success: boolean } | ApiError
  >(response);
  if (!data.success && 'error' in data) throw new Error(data.error);
  return {
    success: data.success,
    message: data.message,
    results: data.results,
  };
}

export type ApplicationRecord = {
  id: string;
  email: string;
  domain: string;
  companyName: string | null;
  jobType: string;
  subject: string;
  status: string;
  appliedAt: string;
  expiresAt: string;
  messageId: string | null;
  emailSent: boolean;
  sendError: string | null;
  recruiterName: string | null;
  recruiterPhone: string | null;
  jobTitle: string | null;
  location: string | null;
  workMode: string | null;
  salary: string | null;
  source: string | null;
  notes: string | null;
  followUpDate: string | null;
  lastContactAt: string | null;
  priority: string;
  tags: string | null;
};

export async function fetchApplicationsList(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const response = await fetch(`/api/applications?${query.toString()}`);
  const data = await parseJson<
    | ApiSuccess<{
        applications: ApplicationRecord[];
        statusCounts: Record<string, number>;
        pagination: PaginationMeta;
      }>
    | ApiError
  >(response);
  if (!data.success) throw new Error(data.error);
  return data;
}

export async function updateApplicationRecord(id: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await parseJson<ApiSuccess<{ application: ApplicationRecord }> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
  return data.application;
}

export async function deleteApplicationRecord(id: string) {
  const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
  const data = await parseJson<ApiSuccess<Record<string, never>> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
}

export async function checkInboxReplies() {
  const response = await fetch('/api/check-replies', { method: 'POST' });
  const data = await parseJson<ApiSuccess<{ message: string; matched: number }> | ApiError>(response);
  if (!data.success) throw new Error(data.error);
  return data;
}
