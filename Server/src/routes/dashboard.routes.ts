import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/summary", requireAuth, getDashboardSummary);

export default router;