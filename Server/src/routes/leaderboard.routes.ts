import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getLeaderboard,
  getUserLeaderboardStatus,
  toggleLeaderboardVisibility,
} from "../controllers/leaderboard.controller.js";

const router = Router();

router.get("/", requireAuth, getLeaderboard);
router.get("/me", requireAuth, getUserLeaderboardStatus);
router.post("/toggle", requireAuth, toggleLeaderboardVisibility);

export default router;
