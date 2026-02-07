import { Request, Response } from "express";
import { compilationLatex } from "../services/latexService";
import { randomUUID } from "node:crypto";
import { uploadPdf } from "../services/storageService";
import logger from "../config/logger";
import { AuthRequest } from "../types/auth";
import { updateResumePdfUrl } from "../services/resumeService";

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
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="resume.pdf"');
    return res.send(result.pdf);
  } else {
    // return errors as JSON
    return res.status(400).json({ error: result.errors });
  }
}

// compile, save to s3, update resume
export async function compileAndSave(req: AuthRequest, res: Response) {
  const { source, resumeId } = req.body;
  logger.info("callig compile and save");
  if (!source) {
    return res.status(400).json({ error: "latex source is required" });
  }

  // compile the latex
  const result = await compilationLatex(source);

  if (!result.success || !result.pdf) {
    return res.status(400).json({ error: result.errors });
  }
  try {
    // generate unique filename with UUID
    const fileName = randomUUID();

    // upload to s3
    const pdfUrl = await uploadPdf(result.pdf, fileName);

    // creating new resume and compiling it won't necesarly save the dpf in s3
    // but if a resumeId got proved means a save action happend
    // and now we need to save pdf file to s3 and link the already created resume to that url
    if (resumeId && req.user) {
      try {
        await updateResumePdfUrl(resumeId, req.user.userId, pdfUrl);
      } catch (error) {
        // log but don't fail, PDF should be already uploaded
        logger.warn({ resumeId, error }, "failed to update resume with pdfUrl");
      }
    }

    // return the url
    return res.json({
      success: true,
      pdfUrl,
      fileName,
    });
  } catch (error) {
    logger.error("s3 upload error: " + error);
    return res.status(500).json({ error: "failed to save pdf" });
  }
}
