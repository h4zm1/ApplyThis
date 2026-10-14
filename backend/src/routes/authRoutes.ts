import { Router } from "express";
import {
  demoLogin,
  exchangeCode,
  login,
  refresh,
  register,
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
  message: { erro: "too many demo sessions, try again later" },
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

export default router;
