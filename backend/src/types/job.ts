import { Prisma } from "@prisma/client";

// job status array (matches prisma schema)
export const STATUS_ORDER = [
  "APPLIED",
  "INITIAL_INTERVIEW",
  "TECHNICAL",
  "SECOND_INTERVIEW",
  "THIRD_INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
  "REPLIED_TOO_LATE",
  "NO_REPLY",
  "REJECTED",
  "WITHDRAWN",
] as const;
// convert array to union, since i need the index of items and at same time keep the union type
export type JobStatus = (typeof STATUS_ORDER)[number];

// what user send when creating a job
export interface createJobDto {
  company: string;
  position: string;
  url?: string;
  status?: JobStatus;
  notes?: string;
  followUpAt?: string; // iso date string
  resumeId?: string;
  orderIndex: Prisma.Decimal;
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
  lastStatusChangedAt?: Date; // optional cause job can be updated without status change
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
  orderIndex: Prisma.Decimal;
  lastStatusChangedAt: Date;
}
