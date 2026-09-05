import { Router } from "express";
import {
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

// GET /api/auth/verifiy-mail
router.get("/verify-mail", verifyMail);

export default router;
