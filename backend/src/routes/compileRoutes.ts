import { Router } from "express";
import { compile, compileAndSave } from "../controllers/compileController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// authenticate = requires authentication
// POST /api/compile
// like @PostMapping("/api/compile") in spring
router.post("/", authenticate, compile);

// POST /api/compile/save (compile and save to s3)
router.post("/save", authenticate, compileAndSave);
export default router;
