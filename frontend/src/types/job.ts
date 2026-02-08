export type JobStatus = "SAVED" | "APPLIED" | "GHOSTED" | "REJECTED";

export interface Job {
  id: string;
  company: string;
  position: JobStatus;
  url: string;
  status: string;
  appliedAt: string;
  followUpAt: string;
  notes: string;
  resumeId: string | null;
  resume: {
    id: string;
    name: string;
    pdfUrl: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  company: string;
  position: string;
  url?: string;
  status?: JobStatus;
  notes?: string;
  followUpAt?: string;
  resumeId?: string;
}

export interface UpdateJobRequest {
  company?: string;
  position?: string;
  url?: string | null; // null to just clear it out
  status?: JobStatus;
  notes?: string;
  followUpAt?: string | null; // null to just give up on the job
  resumeId?: string | null; // null to unlink
}

export interface JobStats {
  SAVED: number;
  APPLIED: number;
  GHOSTED: number;
  REJECTED: number;
  total: number;
}
