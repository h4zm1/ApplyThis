import { versions } from "node:process";
import prisma from "../config/database";
import logger from "../config/logger";
import { CreateResumeDto, UpateResumeDto } from "../types/resume";
import { deletePdf } from "./storageService";

// get all resumes for a user
export async function getUserResume(userId: string) {
  return prisma.resume.findMany({
    // this's like findAllByUserId(userid) in spring
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      pdfUrl: true,
      source: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// get a single resume by id
export async function getResumeById(id: string, userId: string) {
  const resume = prisma.resume.findFirst({
    where: {
      id,
      userId, // user can only access their own resume
    },
  });

  if (!resume) {
    throw new Error("resume not found");
  }
  return resume;
}

// create new resume
export async function createResume(userId: string, data: CreateResumeDto) {
  logger.info(userId + " inside create resume");
  const resume = await prisma.resume.create({
    data: {
      name: data.name,
      source: data.source,
      userId,
    },
  });

  logger.info({ resumeId: resume.id, userId }, "resume created");

  return resume;
}

// update resume
export async function updateResume(
  id: string,
  userId: string,
  data: UpateResumeDto,
) {
  // first check if resume exist and belong to user
  const existing = prisma.resume.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("resume not found");
  }

  const resume = prisma.resume.update({
    where: { id },
    data: {
      // only update the fields that are provided
      ...(data.name && { name: data.name }), // if data.name is undefined then don't update it
      ...(data.source && { source: data.source }),
    },
  });
  logger.info({ resumeId: id, userId }, "resume updated");
  return resume;
}

// delete resume
export async function deleteResume(id: string, userId: string) {
  // check ownership
  const resume = await prisma.resume.findFirst({
    where: { id, userId },
  });

  if (!resume) {
    throw new Error("resume not found");
  }

  // manual clean up for s3 files
  if (resume.pdfUrl) {
    try {
      // try/catch to keep on deleting if something happen (already gone) and not stop
      // get filename from url cause deletePdf function in storage service attach file extesnsion by itself (to guarantee consistancy)
      const filename = resume.pdfUrl.split("/").pop()?.replace(".pdf", "");
      if (filename) await deletePdf(filename);
    } catch (error) {
      logger.warn({ resumeId: resume.id }, "failed to delete pdf from s3");
    }
  }

  // delete resume (cascades to version due to schema) from database
  await prisma.resume.delete({
    where: { id },
  });

  logger.info({ resumeId: id, userId }, "resume deleted");
}

// update the pdfurl of already existing resume
export async function updateResumePdfUrl(
  resumeId: string,
  userId: string,
  pdfUrl: string,
) {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) throw new Error("resume not found");

  // delete old PDF from s3 if exist (to avoid orphan files in s3)
  if (resume.pdfUrl) {
    try {
      const oldPDFName = resume.pdfUrl.split("/").pop()!.replace(".pdf", "");
      await deletePdf(oldPDFName);
    } catch (error) {
      logger.warn("failed to delete old pdf from s3");
    }
  }

  await prisma.resume.update({
    where: { id: resumeId },
    data: { pdfUrl },
  });
  logger.info({ resumeId, pdfUrl }, "resume pdf url updated");
}
