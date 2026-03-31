import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getMoodTrends,
  getTriggers,
  getInsights,
  getComparison,
  exportReport,
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/mood-trends", requireAuth, getMoodTrends);
router.get("/triggers", requireAuth, getTriggers);
router.get("/insights", requireAuth, getInsights);
router.get("/comparison", requireAuth, getComparison);
router.get("/export-report", requireAuth, exportReport);

export default router;
