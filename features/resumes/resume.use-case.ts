import path from 'path';
import fs from 'fs';
import { resumeRepository, type ResumeMeta } from '@/features/resumes/resume.repository';
import { NotFoundError, ValidationError } from '@/lib/api/errors';

const MAX_RESUME_BYTES = 4 * 1024 * 1024;
const FALLBACK_CV_FILENAME = process.env.CV_FILENAME ?? 'Musharraf-CV.pdf';

export type ResolvedResume = {
  filename: string;
  content: Buffer;
  mimeType: string;
};

function assertPdf(file: File) {
  const isPdf =
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    throw new ValidationError('Only PDF resumes are allowed');
  }
  if (file.size <= 0) {
    throw new ValidationError('Resume file is empty');
  }
  if (file.size > MAX_RESUME_BYTES) {
    throw new ValidationError('Resume must be 4MB or smaller');
  }
}

export async function listResumes(): Promise<ResumeMeta[]> {
  return resumeRepository.findManyMeta();
}

export async function uploadResume(file: File, makeDefault: boolean): Promise<ResumeMeta> {
  assertPdf(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const shouldBeDefault = makeDefault || (await resumeRepository.findManyMeta()).length === 0;

  if (shouldBeDefault) {
    await resumeRepository.clearDefaultFlags();
  }

  return resumeRepository.create({
    name: file.name.replace(/[^\w.\-() ]+/g, '_').slice(0, 120) || 'resume.pdf',
    data: buffer,
    mimeType: 'application/pdf',
    size: buffer.length,
    isDefault: shouldBeDefault,
  });
}

export async function setDefaultResume(id: string): Promise<ResumeMeta> {
  const existing = await resumeRepository.findMeta(id);
  if (!existing) {
    throw new NotFoundError('Resume not found');
  }

  await resumeRepository.clearDefaultFlags();
  return resumeRepository.setDefault(id);
}

export async function deleteResume(id: string): Promise<void> {
  const existing = await resumeRepository.findMeta(id);
  if (!existing) {
    throw new NotFoundError('Resume not found');
  }

  await resumeRepository.delete(id);

  if (existing.isDefault) {
    const remaining = await resumeRepository.findManyMeta();
    if (remaining[0]) {
      await resumeRepository.setDefault(remaining[0].id);
    }
  }
}

export async function getResumeFile(id: string): Promise<ResolvedResume> {
  const resume = await resumeRepository.findWithData(id);
  if (!resume) {
    throw new NotFoundError('Resume not found');
  }

  return {
    filename: resume.name,
    content: Buffer.from(resume.data),
    mimeType: resume.mimeType,
  };
}

function loadFallbackCv(): ResolvedResume | null {
  const cvPath = path.join(process.cwd(), 'public', FALLBACK_CV_FILENAME);
  if (!fs.existsSync(cvPath)) return null;
  return {
    filename: FALLBACK_CV_FILENAME,
    content: fs.readFileSync(cvPath),
    mimeType: 'application/pdf',
  };
}

/** Resolve CV for a send: template-specific → global default → public fallback */
export async function resolveResumeForSend(resumeId?: string | null): Promise<ResolvedResume> {
  if (resumeId) {
    const templateResume = await resumeRepository.findWithData(resumeId);
    if (templateResume) {
      return {
        filename: templateResume.name,
        content: Buffer.from(templateResume.data),
        mimeType: templateResume.mimeType,
      };
    }
  }

  const defaultResume = await resumeRepository.findDefault();
  if (defaultResume) {
    return {
      filename: defaultResume.name,
      content: Buffer.from(defaultResume.data),
      mimeType: defaultResume.mimeType,
    };
  }

  const fallback = loadFallbackCv();
  if (fallback) return fallback;

  throw new ValidationError(
    'No resume found. Upload a resume in Templates, or add a PDF to the public folder.'
  );
}
