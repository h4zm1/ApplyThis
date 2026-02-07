import prisma from "../config/database";
import logger from "../config/logger";
import { createJobDto, JobStatus, updateJobDto } from "../types/job";

// get all jobs for a user
export async function getUserJobs(userId: string, status?: JobStatus) {
  return prisma.job.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      resume: {
        select: {
          id: true,
          name: true,
          pdfUrl: true,
        },
      },
    },
  });
}

// get a single job by id
export async function getJobById(id: string, userId: string) {
  const job = await prisma.job.findFirst({
    where: { id, userId },
    include: {
      resume: {
        select: {
          id: true,
          name: true,
          pdfUrl: true,
        },
      },
    },
  });
  /* this will return something liek this:
  "id": "job_123",
  "userId": "user_456",
  "status": "APPLIED",
  "updatedAt": "2026-02-22",
  "resume": {
    "id": "res_789",
    "name": "resume2.pdf",
    "pdfUrl": "https://s3..."
  }
  */

  if (!job) throw new Error("job not found");

  return job;
}

// create new job
export async function createJob(userId: string, data: createJobDto) {
  // if resume provided, verify it belong to user
  if (data.resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId, userId },
    });

    if (!resume) throw new Error("resume not found");
  }

  const job = await prisma.job.create({
    data: {
      company: data.company,
      position: data.position,
      url: data.url,
      status: data.status || "APPLIED",
      notes: data.notes,
      followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
      resumeId: data.resumeId,
      userId,
    },
    include: {
      resume: {
        select: {
          id: true,
          name: true,
          pdfUrl: true,
        },
      },
    },
  });

  logger.info({ jobId: job.id, company: job.company, userId }, "job created");
  return job;
}

// update job
export async function updateJob(
  id: string,
  userId: string,
  data: updateJobDto,
) {
  const existing = await prisma.job.findFirst({
    where: { id, userId },
  });

  if (!existing) throw new Error("job not found");

  // if resumeId provided, verify it belong to user
  if (data.resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId, userId },
    });

    if (!resume) throw new Error("resume not found");
  }

  const job = await prisma.job.update({
    where: { id },
    data: {
      ...(data.company && { company: data.company }),
      ...(data.position && { position: data.position }),
      ...(data.url !== undefined && { url: data.url }), // if it's undefined, don't update
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.followUpAt !== undefined && {
        followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
      }),
      ...(data.resumeId !== undefined && { resumeId: data.resumeId }),
    },
    include: {
      resume: {
        select: {
          id: true,
          name: true,
          pdfUrl: true,
        },
      },
    },
  });
  logger.info({ jobId: id, userId }, "job updated");
  return job;
}

// delete job
export async function deleteJob(id: string, userId: string) {
  // check it exist first
  const job = await prisma.job.findFirst({
    where: { id, userId },
  });

  if (!job) {
    throw new Error("job not found");
  }

  await prisma.job.delete({
    where: { id },
  });

  logger.info({ jobId: id, userId }, "job deleted");
}

// get job stats for user
export async function getJobStats(userId: string) {
  // this will return something like: [{status:'APPLIED', _cound:{status:10},{status:'GHOSTED',_count:{status:10}}}]
  const stats = await prisma.job.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  // convert to object
  const result: Record<string, number> = {
    SAVED: 0,
    APPLIED: 0,
    GHOSTED: 0,
    REJECTED: 0,
    TOTAL: 0,
  };

  for (const stat of stats) {
    result[stat.status] = stat._count.status; // look for the status category and fill it
    result.TOTAL += stat._count.status; // keep adding to overall total
  }
  return result;
}
