import { Request, Response } from "express";
import { compilationLatex } from "../services/latexService";
import { randomUUID } from "node:crypto";
import { uploadPdf, uploadThumbnail } from "../services/storageService";
import logger from "../config/logger";
import { AuthRequest } from "../types/auth";
import {
  resumeBelongsToUser,
  updateResumePdfAndThumbnailUrl,
} from "../services/resumeService";
import { pdfToPng } from "pdf-to-png-converter";

// TODO: limit page compilation to 3 pages max
// compile only endpoint, return pdf
export async function compile(req: Request, res: Response) {
  const { source } = req.body;
  logger.info("calling compile");

  // validate input (like @valid in spring, but manual)
  if (!source) {
    return res.status(400).json({ error: "latex source is required" });
  }

  // call service
  const result = await compilationLatex(source);

  if (result.success && result.pdf) {
    // return pdf (like ResponseEntity<Byte[]> with content type header in spring)
    // res.setHeader("Content-Type", "application/pdf");
    // json instead of pdf to prevent IDM from picking this up
    // res.setHeader("Content-Disposition", 'inline; filename="resume.pdf"');
    res.setHeader("Content-Type", "application/json");

    return res.send(result.pdf);
  } else {
    // return errors as JSON
    return res.status(400).json({ error: result.errors });
  }
}

export async function generateThumbnail(pdfBuffer: Buffer): Promise<Buffer> {
  // extract arraybuffer from node buffer
  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength,
  );

  const pages = await pdfToPng(arrayBuffer, {
    viewportScale: 0.5,
    pagesToProcess: [1],
  });

  if (!pages.length || !pages[0].content) {
    throw new Error("failed to generate thumbnail");
  }

  return Buffer.from(pages[0].content);
}

// compile, save to s3, update resume
export async function compileAndSave(req: AuthRequest, res: Response) {
  const { source, resumeId } = req.body;
  logger.info("callig compile and save");
  if (!source) {
    return res.status(400).json({ error: "latex source is required" });
  }
  if (!resumeId) {
    return res.status(400).json({ error: "resumeId requied to save" });
  }
  if (!req.user?.userId) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // fail early before wasting time compiling, incase user to compile a resume they don't own (rabit hole)
  if (!(await resumeBelongsToUser(resumeId, req.user.userId))) {
    return res.status(404).json({ error: "resume not found" });
  }

  // demo files get a prefix so the cleanup cron can find them by user
  const fileName = req.user.demo
    ? `demo-${req.user.userId}-${randomUUID()}`
    : randomUUID();
  try {
    // compile the latex
    const result = await compilationLatex(source);

    if (!result.success || !result.pdf) {
      return res.status(400).json({ error: result.errors });
    }

    // upload pdf and generate thumbnail in paralel
    const [pdfUrl, thumbnailUrl] = await Promise.all([
      uploadPdf(result.pdf, fileName),
      generateThumbnail(result.pdf).then((thumbnailBuffer) =>
        uploadThumbnail(thumbnailBuffer, fileName),
      ),
    ]);

    // creating new resume and compiling it won't necesarly save the dpf in s3
    // but if a resumeId got proved means a save action happend
    // and now we need to save pdf file to s3 and link the already created resume to that url
    await updateResumePdfAndThumbnailUrl(
      resumeId,
      req.user.userId,
      pdfUrl,
      thumbnailUrl,
    );

    // return the url
    return res.json({
      success: true,
      pdfUrl,
      thumbnailUrl,
      fileName,
    });
  } catch (error) {
    logger.error("s3 upload error or db update error: " + error);
    return res.status(500).json({ error: "failed to save pdf and thumbnail" });
  }
}
