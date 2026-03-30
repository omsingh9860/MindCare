import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getDashboardSummary } from "../controllers/dashboard.controller";

const router = Router();

router.get("/summary", requireAuth, getDashboardSummary);

export default router;