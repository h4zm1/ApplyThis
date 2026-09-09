import { Router } from "express";
import {
  exchangeCode,
  login,
  refresh,
  register,
  verifyMail,
} from "../controllers/authController";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/refresh
router.post("/refresh", refresh);

// POST
router.post("/exchange-code", exchangeCode);

export default router;
