import { Request, Response } from "express";
import {
  loginUser,
  refreshTokens,
  registerUser,
} from "../services/authService";
import logger from "../config/logger";

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // validate input
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "password must be at least 6 characters" });
    }

    const token = await registerUser(email, password);
    return res.status(201).json(token);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        {
          message: error.message,
          stack: error.stack,
        },
        "registration failed",
      );
      if (error.message === "email already registered") {
        return res.status(409).json({ error: "email already exist" }); // 409 for conflict
      }
    }
    logger.error({ error }, "registration failed");
    res.status(500).json({ error: "registration failed" }); // 500 server error
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // validate input
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const token = await loginUser(email, password);
    return res.json(token);
  } catch (error) {
    if (error instanceof Error && error.message === "invalid credentials") {
      return res.status(401).json({ error: "invalid credentials" }); // 401 for anauthorizrd
    }
    logger.error({ error }, "login failed");
    res.status(500).json({ error: "login failed" });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "refresh token required" });
    }

    const refreshedToken = refreshTokens(refreshToken);
    return res.json(refreshedToken);
  } catch (error) {
    // token invalid or expired
    return res.status(401).json({ error: "invaild refresh token" });
  }
}
