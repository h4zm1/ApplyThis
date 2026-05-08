import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  create,
  getJob,
  listJobs,
  remove,
  stats,
  update,
  updateOrder
} from "../controllers/jobController";

const router = Router();

router.use(authenticate);

// this need to come first before GET /:id or it will mistakes 'stats' as an id
router.get("/stats", stats);

router.get("/", listJobs);
router.get("/:id", getJob);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);
router.post("/order/:id", updateOrder)
export default router;
