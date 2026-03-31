import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  getMoodTrends,
  getTriggers,
  getInsights,
  getComparison,
  exportReport,
} from "../controllers/analytics.controller";

const router = Router();

router.get("/mood-trends", requireAuth, getMoodTrends);
router.get("/triggers", requireAuth, getTriggers);
router.get("/insights", requireAuth, getInsights);
router.get("/comparison", requireAuth, getComparison);
router.get("/export-report", requireAuth, exportReport);

export default router;
