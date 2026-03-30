import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getSettings, sendAlert, updateSettings } from "../controllers/crisis.controller";

const router = Router();

router.get("/settings", requireAuth, getSettings);
router.put("/settings", requireAuth, updateSettings);
router.post("/alert", requireAuth, sendAlert);

export default router;