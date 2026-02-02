import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  create,
  getResume,
  listResumes,
  remove,
  update,
} from "../controllers/resumeController";

const router = Router();

// all routes requires authentication, apply to all reoutes in this router
router.use(authenticate);

// GET /api/resumes    list all user resumes
router.get("/", listResumes);

// GET /api/resumes/:id    get single resume (this will return the latex code that will get loaded into the editor)
router.get("/:id", getResume);

// POST /api/resumes      create new resume
router.post("/", create);

// PUT /api/resume/:id    update resume
router.put("/:id", update);

// DELETE /api/resume/:id   delete resume
router.delete("/:id", remove);

export default router;
