import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  create,
  getJob,
  listJobs,
  remove,
  sankeyData,
  stats,
  update,
  updateOrder,
  barData,
  weeklyStats,
  staleJobsCount,
  markAllStaleAsGhosted,
} from "../controllers/jobController";
import { capJobs } from "../middleware/demoLimits";

const router = Router();

router.use(authenticate);

// this need to come first before GET /:id or it will mistakes 'stats' as an id
router.get("/stats", stats);
router.get("/sankey", sankeyData);
router.get("/weekly", barData);
router.get("/weeklystats", weeklyStats);
router.get("/stalecount", staleJobsCount);
router.get("/markallstale", markAllStaleAsGhosted);

router.get("/", listJobs);
router.get("/:id", getJob);
router.post("/", capJobs, create);
router.put("/:id", update);
router.delete("/:id", remove);
router.post("/order/:id", updateOrder);
export default router;
