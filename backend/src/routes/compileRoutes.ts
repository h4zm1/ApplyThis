import { Router } from "express";
import { compile, compileAndSave } from "../controllers/compileController";
import { authenticate } from "../middleware/authMiddleware";
import {
  capSource,
  demoCompileGlobal,
  demoCompilePerUser,
} from "../middleware/demoLimits";

const router = Router();

// authenticate = requires authentication
// POST /api/compile
// like @PostMapping("/api/compile") in spring
// order matters here, authenticate comes first to populate req.user that the other middleware and compile needs
// peruser come first so we don't touch global if the user is ratelimited in their session
router.post(
  "/",
  authenticate,
  demoCompilePerUser,
  demoCompileGlobal,
  capSource,
  compile,
);

// POST /api/compile/save (compile and save to s3)
router.post(
  "/save",
  authenticate,
  demoCompilePerUser,
  demoCompileGlobal,
  capSource,
  compileAndSave,
);
export default router;
