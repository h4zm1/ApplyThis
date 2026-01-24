import { Request, Response } from "express";
import { compilationLatex } from "../services/latexService";

export async function compile(req: Request, res: Response) {
  const { source } = req.body;

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
