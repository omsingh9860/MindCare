import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { createMoodAssessment, listMoodAssessments } from "../controllers/mood.controller";

const router = Router();

router.get("/", requireAuth, listMoodAssessments);
router.post("/", requireAuth, createMoodAssessment);

export default router;