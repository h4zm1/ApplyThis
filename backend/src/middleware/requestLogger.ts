import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // log when response finishe
  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info(
      {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: duration + "ms",
      },
      "request completed",
    );
  });
  next();
}
