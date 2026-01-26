import { Router } from "express";
import { compile, compileAndSave } from "../controllers/compileController";

const router = Router();

// POST /api/compile
// like @PostMapping("/api/compile") in spring
router.post("/", compile);

// POST /api/compile/save (compile and save to s3)
router.post("/save", compileAndSave);
export default router;
