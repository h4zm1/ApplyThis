import { Response } from "express";
import { AuthRequest } from "../types/auth";
import { JobStatus } from "../types/job";
import {
  createJob,
  deleteJob,
  getJobById,
  getJobStats,
  getUserJobs,
  updateJob,
} from "../services/jobService";
import logger from "../config/logger";

// GET /api/jobs
export async function listJobs(req: AuthRequest, res: Response) {
  try {
    const status = req.query.status as JobStatus | undefined;
    const jobs = await getUserJobs(req.user!.userId, status);
    return res.json(jobs);
  } catch (error) {
    logger.error({ error }, "failed to list jobs");
    return res.status(500).json({ error: "failed to list jobs" });
  }
}

// GET /api/jobs/status
export async function stats(req: AuthRequest, res: Response) {
  try {
    const jobStats = await getJobStats(req.user!.userId);
    return res.json(jobStats);
  } catch (error) {
    logger.error({ error }, "failed to get job stats");
    return res.status(500).json({ error: "failed to get job stats" });
  }
}

// GET /api/jobs/:id
export async function getJob(req: AuthRequest, res: Response) {
  try {
    const job = await getJobById(req.params.id, req.user!.userId);
    return res.json(job);
  } catch (error) {
    if (error instanceof Error && error.message === "job not found") {
      return res.status(404).json({ error: "job not found" });
    }
    logger.error({ error }, "failed to get job");
    return res.status(500).json({ error: "failed to get job" });
  }
}

// POST /api/jobs
export async function create(req: AuthRequest, res: Response) {
  try {
    const { company, position, url, status, notes, followUpAt, resumeId } =
      req.body;

    if (!company || !position) {
      return res.status(400).json({ error: "company and position required" });
    }

    const job = await createJob(req.user!.userId, {
      company,
      position,
      url,
      status,
      notes,
      followUpAt,
      resumeId,
    });

    return res.status(201).json(job);
  } catch (error) {
    if (error instanceof Error && error.message === "resume not found") {
      return res.status(404).json({ error: "resume not found" });
    }

    logger.error({ error }, "failed to create job");
    return res.status(500).json({ error: "failed to create job" });
  }
}

// PUT /api/jobs/:id
export async function update(req: AuthRequest, res: Response) {
  try {
    const { company, position, url, status, notes, followUpAt, resumeId } =
      req.body;

    const job = await updateJob(req.params.id, req.user!.userId, {
      company,
      position,
      url,
      status,
      notes,
      followUpAt,
      resumeId,
    });

    return res.json(job);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "job not found") {
        return res.status(404).json({ error: "job not found" });
      }
      if (error.message === "resume not found") {
        return res.status(404).json({ error: "resume not found" });
      }
    }

    logger.error({ error }, "failed to update job");
    return res.status(500).json({ error: "failed to update job" });
  }
}

// DELTE /api/jobs/:id
export async function remove(req: AuthRequest, res: Response) {
  try {
    await deleteJob(req.params.id, req.user!.userId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "job not found") {
      return res.status(404).json({ error: "job not found" });
    }

    logger.error({ error }, "failed to delete job");
    return res.status(500).json({ error: "failed to delete job" });
  }
}
