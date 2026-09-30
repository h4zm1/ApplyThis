export type JobStatus =
  | "APPLIED"
  | "NO_REPLY"
  | "REPLIED_TOO_LATE"
  | "INITIAL_INTERVIEW"
  | "TECHNICAL"
  | "SECOND_INTERVIEW"
  | "THIRD_INTERVIEW"
  | "FINAL_INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN"
  | "ALL";
export interface Job {
  id: string;
  company: string;
  position: string;
  url: string;
  status: JobStatus;
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
  orderIndex: number;
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
  APPLIED: number;
  NO_REPLY: number;
  REPLIED_TOO_LATE: number;
  INITIAL_INTERVIEW: number;
  TECHNICAL: number;
  SECOND_INTERVIEW: number;
  THIRD_INTERVIEW: number;
  FINAL_INTERVIEW: number;
  OFFER: number;
  REJECTED: number;
  WITHDRAWN: number;

  TOTAL: number;
}

export interface WeeklyStats {
  stats: string;
  thisWeek: number;
  lastWeek: number;
}
