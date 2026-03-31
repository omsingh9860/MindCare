import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { createMoodAssessment, listMoodAssessments } from "../controllers/mood.controller.js";

const router = Router();

router.get("/", requireAuth, listMoodAssessments);
router.post("/", requireAuth, createMoodAssessment);

export default router;