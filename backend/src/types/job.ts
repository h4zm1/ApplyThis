// job status enum (matches prisma schema)
export type JobStatus = "SAVED" | "APPLIED" | "GHOSTED" | "REJECTED";

// what user send when creating a job
export interface createJobDto {
  company: string;
  position: string;
  url?: string;
  status?: JobStatus;
  notes?: string;
  followUpAt?: string; // iso date string
  resumeId?: string;
}

// what user send when updating a job
export interface updateJobDto {
  company?: string;
  position?: string;
  url?: string;
  status?: JobStatus;
  notes?: string;
  followUpAt?: string | null; // null to clear
  resumeId?: string | null; // null to unlink
}

// what we return to use
export interface JobResponse {
  id: string;
  company: string;
  postion: string;
  url: string | null;
  status: JobStatus;
  appliedAt: Date;
  followUpAt: Date | null;
  notes: string | null;
  resumeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
