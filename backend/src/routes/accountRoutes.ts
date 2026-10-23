import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/authMiddleware";
import { blockDemo } from "../middleware/demoLimits";
import {
  removeAccount,
  updatePassword,
} from "../controllers/accountController";
import { AuthRequest } from "../types/auth";

const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true, // only failed attempts count
  keyGenerator: (req) => (req as AuthRequest).user!.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many attempts, try again later" },
});

const router = Router();

router.use(authenticate, blockDemo, accountLimiter);

router.post("/password", updatePassword);
router.delete("/", removeAccount);
export default router;
