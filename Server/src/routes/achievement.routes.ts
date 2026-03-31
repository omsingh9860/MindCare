import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getUserAchievements,
  getBadgesCatalog,
  unlockAchievement,
  getCurrentStreaks,
} from "../controllers/achievement.controller.js";

const router = Router();

router.get("/user", requireAuth, getUserAchievements);
router.get("/badges", requireAuth, getBadgesCatalog);
router.post("/unlock", requireAuth, unlockAchievement);
router.get("/streaks/current", requireAuth, getCurrentStreaks);

export default router;
