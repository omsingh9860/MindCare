import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  getLeaderboard,
  getUserLeaderboardStatus,
  toggleLeaderboardVisibility,
} from "../controllers/leaderboard.controller";

const router = Router();

router.get("/", requireAuth, getLeaderboard);
router.get("/me", requireAuth, getUserLeaderboardStatus);
router.post("/toggle", requireAuth, toggleLeaderboardVisibility);

export default router;
