import { Router } from "express";
import {
  demoLogin,
  exchangeCode,
  forgotPassword,
  login,
  refresh,
  register,
  resetPassword,
  verifyMail,
} from "../controllers/authController";
import rateLimit from "express-rate-limit";

const router = Router();

// this will be using the ip adress
const rateLimitter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many demo sessions, try again later" },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many requests, try again later" },
});
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many requests, try again later" },
});

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/refresh
router.post("/refresh", refresh);

router.get("/verify-mail", verifyMail);
// POST
router.post("/exchange-code", exchangeCode);

// POST /api/auth/demo
router.post("/demo", rateLimitter, demoLogin);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotLimiter, forgotPassword);
// POST /api/auth/reset-password
router.post("/reset-password", resetLimiter, resetPassword);

export default router;
