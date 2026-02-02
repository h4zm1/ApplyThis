import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/authService";
import { AuthRequest } from "../types/auth";
import logger from "../config/logger";

/*
 *NOTE: so how middleware works here in express is Request comes in => Middleware 1 (cors) =>
        Middlewarze 2 (json parser) => middleware 3 (authentication) (this one) => controller (route handler) => 
        response goes out
        so next() is passwing control to the next middleware/controller
 */

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  // get authorized header
  const authHeader = req.headers.authorization;

  // check format (if contains token) "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "no token provided" });
  }

  // extract token (remvove "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    // verify token and get payload
    const payload = verifyAccessToken(token);

    //attach user to request (this will make user available in controller)
    req.user = payload;

    // continue to next middleware/controller, without next() the request stops here, llike filterChain.doFilter(req, res) in spring
    next();
  } catch (error) {
    logger.debug({ error }, "token verification failed");
    return res.status(401).json({ error: "invalid token" });
  }
}
