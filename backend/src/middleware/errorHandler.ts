import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";

// this should catch any unhandled error in routes
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  logger.error(
    {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    "unhandled error",
  );

  // don't expose stack take in proc
  const isDev = process.env.NODE_ENV == "development";

  res.status(400).json({
    error: "internal server error",
    ...(isDev && { message: err.message, stack: err.stack }), // if isDev is true, it moves to next part and return object {message..} else it stops and return false, and false will get ignored
  });
}
