import { Router } from "express";
import { login, refresh, register } from "../controllers/authController";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/refresh
router.post("/refresh", refresh);

export default router;
