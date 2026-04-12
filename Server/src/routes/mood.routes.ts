import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { createMoodAssessment, listMoodAssessments, markMoodForAnalysis } from "../controllers/mood.controller.js";

const router = Router();

router.get("/", requireAuth, listMoodAssessments);
router.post("/", requireAuth, createMoodAssessment);
router.post("/:id/mark-analysis", requireAuth, markMoodForAnalysis);

export default router;