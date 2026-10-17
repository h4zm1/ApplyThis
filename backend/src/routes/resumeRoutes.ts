import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  create,
  getResume,
  listResumes,
  remove,
  update,
  updateOrder,
  updateSource,
} from "../controllers/resumeController";
import { capResumes, capSource } from "../middleware/demoLimits";

const router = Router();

// all routes requires authentication, apply to all reoutes in this router
router.use(authenticate);

// GET /api/resumes    list all user resumes
router.get("/", listResumes);

// GET /api/resumes/:id    get single resume (this will return the latex code that will get loaded into the editor)
router.get("/:id", getResume);

// POST /api/resumes      create new resume
router.post("/", capResumes, capSource, create);

// PUT /api/resumes/:id/source
router.put("/source/:id", capSource, updateSource);

// PUT /api/resume/:id    cap source for demo users and update resume
router.put("/:id", capSource, update);

// DELETE /api/resume/:id   delete resume
router.delete("/:id", remove);

// POST /api/resumes/:id/order
router.post("/order/:id", updateOrder);

export default router;
