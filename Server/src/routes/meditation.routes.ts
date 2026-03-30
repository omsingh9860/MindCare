import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getMeditationSummary, logMeditationSession } from "../controllers/meditation.controller";

const router = Router();

router.get("/summary", requireAuth, getMeditationSummary);
router.post("/log", requireAuth, logMeditationSession);

export default router;