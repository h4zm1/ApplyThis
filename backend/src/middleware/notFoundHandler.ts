import { Request, Response } from "express";

// this should catch unmatched routes, instead of returning an html
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: "not found",
    path: req.path,
  });
}
