import { Router } from "express";
import { compile } from "../controllers/compileController";

const router = Router();

// POST /api/compile
// like @PostMapping("/api/compile") in spring
router.post("/", compile);

export default router;
