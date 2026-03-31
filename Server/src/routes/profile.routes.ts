import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";

const router = Router();

router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, updateProfile);

export default router;