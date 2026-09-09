import { Request, Response } from "express";
import {
  checkVerified,
  exchangeAuthCode,
  generateAuthCode,
  loginUser,
  refreshTokens,
  registerUser,
  verifyEmail,
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
    return res.status(200).json(token);
  } catch (error) {
    if (error instanceof Error && error.message === "invalid credentials") {
      return res.status(401).json({ error: "invalid credentials" }); // 401 for anauthorizrd
    }

    if (error instanceof Error && error.message === "email not verified")
      return res.status(403).json({ error: "email not verified" });

    logger.error({ error }, "login failed");
    res.status(500).json({ error: "login failed" });
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "refresh token required" });
    }

    const refreshedToken = await refreshTokens(refreshToken);
    return res.json(refreshedToken);
  } catch (error) {
    // token invalid or expired
    return res.status(401).json({ error: "invaild refresh token" });
  }
}

// verify tokens, generate auth code, redirect to frend with code
export async function verifyMail(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "token required" });
    }

    const user = await verifyEmail(token);
    const authCode = await generateAuthCode(user.id);

    // redirect to auth callback page with the code
    // code will be visible in url but the 2 min expiration will be the safty net (too lazy for httponly cookies)
    return res.redirect(
      `${process.env.APP_URL}/auth-callback?code=${authCode}`,
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ message: error.message }, "email verification failed");

      if (error.message === "token expired") {
        // if token expired redirect to where they can reqeust new link
        return res.redirect(`${process.env.APP_URL}/login?error=token_expired`);
      }
      if (error.message === "invalid token") {
        return res.redirect(`${process.env.APP_URL}/login?error=invalid_token`);
      }
    }
    res.status(500).json({ error: "verification failed" });
  }
}

// this will exchange the code the jwt tokens
export async function exchangeCode(req: Request, res: Response) {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "code required" });
    }

    const tokens = await exchangeAuthCode(code);
    return res.status(200).json(tokens);
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ message: error.message }, "code exchange failed");

      if (error.message === "invalid code") {
        return res.status(400).json({ error: "invalid code" });
      }
      if (error.message === "code expired") {
        return res
          .status(400)
          .json({ error: "code expired, please log in manually" });
      }
    }
    res.status(500).json({ error: "exchange failed" });
  }
}
