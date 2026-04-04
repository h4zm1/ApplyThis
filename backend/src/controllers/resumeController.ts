import { Request, Response } from "express";
import {
  createResume,
  deleteResume,
  getResumeById,
  getUserResume,
  updateResume,
  updateResumeOrderInDB,
} from "../services/resumeService";
import { AuthRequest } from "../types/auth";
import logger from "../config/logger";
import { console } from "node:inspector";

// GET /api/resumes
export async function listResumes(req: AuthRequest, res: Response) {
  try {
    const resume = await getUserResume(req.user!.userId); // we know req.user exist cause 'authenticate' middleware already verified the token
    return res.json(resume);
  } catch (error) {
    logger.error({ error }, "failed to list resumes");
    return res.status(500).json({ error: "failed to list resumes" });
  }
}

// GET /api/resumes/:id
export async function getResume(req: AuthRequest, res: Response) {
  try {
    const resume = await getResumeById(req.params.id, req.user!.userId);
    return res.json(resume);
  } catch (error) {
    logger.error({ error }, "failed to get resume");
    return res.status(500).json({ error: "failed to list resumes" });
  }
}

// POST /api/resumes
export async function create(req: AuthRequest, res: Response) {
  try {
    const { name, source, orderIndex } = req.body;

    if (!name || !source) {
      return res.status(400).json({ error: "name and source required" });
    }

    const resume = await createResume(req.user!.userId, {
      name,
      source,
      orderIndex,
    });
    return res.status(201).json(resume);
  } catch (error) {
    logger.error(error, "FAILED RESUME CREATION");
    res.status(500).json({ error: "failed to create resume" });
  }
}

// PUT /api/resumes/:id
export async function update(req: AuthRequest, res: Response) {
  try {
    const { name, source } = req.body;

    if (!name && !source)
      return res.status(400).json({ error: "name or source required" });

    const resume = await updateResume(req.params.id, req.user!.userId, {
      name,
      source,
    });
    return res.json(resume);
  } catch (error) {
    if (error instanceof Error && error.message === "resume not found") {
      return res.status(500).json({ error: "resume not foid" });
    }
    logger.error({ error: "failed to update resume" });
    return res.status(500).json({ error: "failed to update resume" });
  }
}

// DELTE /api/resume/:id
export async function remove(req: AuthRequest, res: Response) {
  try {
    await deleteResume(req.params.id, req.user!.userId);
    return res.status(200).send();
  } catch (error) {
    if (error instanceof Error && error.message === "resume not found") {
      return res.status(400).json({ error: "resume not found" });
    }
    logger.error({ error }, "failed to delete resume");
    return res.status(500).json({ error: "failed to delete resume" });
  }
}

// update order index /api/resume/:id/order
export async function updateOrder(req: AuthRequest, res: Response) {
  try {
    const { orderIndex } = req.body;
    logger.info("ORDER INDEX", orderIndex);
    const resume = await updateResumeOrderInDB(
      req.params.id,
      req.user!.userId,
      orderIndex,
    );
    return res.json(resume);
  } catch (error) {
    logger.error(error, "Failed to update order");
    return res.status(500).json({ error: "Failed to update order" });
  }
}
