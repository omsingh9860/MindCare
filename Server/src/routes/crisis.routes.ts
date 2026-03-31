import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getSettings,
  sendAlert,
  updateSettings,
  startAutoAlert,
  cancelAutoAlert,
} from "../controllers/crisis.controller.js";

const router = Router();

router.get("/settings", requireAuth, getSettings);
router.put("/settings", requireAuth, updateSettings);

// manual: send immediately
router.post("/alert", requireAuth, sendAlert);

// auto: schedule + cancel
router.post("/alert/start", requireAuth, startAutoAlert);
router.post("/alert/cancel/:alertId", requireAuth, cancelAutoAlert);

export default router;