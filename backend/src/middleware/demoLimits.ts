import { Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { AuthRequest } from "../types/auth";
import prisma from "../config/database";

const MAX_DEMO_JOBS = 10;
const MAX_DEMO_RESUMES = 3;
const MAX_SOURCE_CHARS = 5_000;

// just staight up block the route
export function blockDemo(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.demo) {
    return res.status(403).json({ error: "not available in demo mode" });
  }
  next();
}

export async function capJobs(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user?.demo) return next(); // skip everything if the user is normal user
  try {
    const count = await prisma.job.count({
      where: { userId: req.user.userId },
    });
    if (count >= MAX_DEMO_JOBS) {
      return res.status(403).json({
        error: `demo accounts are limited to ${MAX_DEMO_JOBS} jobs`,
        code: "DEMO_LIMIT",
      });
    }
    next();
  } catch (error) {
    next(error);
  }
}

export async function capResumes(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user?.demo) return next();
  try {
    const count = await prisma.resume.count({
      where: { userId: req.user.userId },
    });
    if (count >= MAX_DEMO_RESUMES) {
      return res.status(403).json({
        error: `demo accounts are limited to ${MAX_DEMO_RESUMES} resumes`,
        code: "DEMO_LIMIT",
      });
    }
    next();
  } catch (error) {
    next(error);
  }
}

// cap resume latex source size
export function capSource(req: AuthRequest, res: Response, next: NextFunction) {
  if (
    req.user?.demo &&
    typeof req.body?.source === "string" &&
    req.body.source.length > MAX_SOURCE_CHARS
  ) {
    return res.status(413).json({
      error: "resume source too large for demo mode",
      code: "DEMO_LIMIT",
    });
  }
  next();
}

// return true if the user isn't demo
const realUser = (req: any) => !(req as AuthRequest).user?.demo;

export const demoCompilePerUser = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => (req as AuthRequest).user!.userId,
  skip: realUser, // real users are not limited, this will call realUser function and pass "req" to it
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "demo compile limit reached, sign up for unlimited compiles",
    code: "DEMO_LIMIT",
  },
});

// limit all users combined to 20
export const demoCompileGlobal = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 100, // all demo users combined got 100 compile per hour
  keyGenerator: () => "all-demo-users",
  skip: realUser,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "demo is busy right now, try again later",
    code: "DEMO_LIMIT",
  },
});
