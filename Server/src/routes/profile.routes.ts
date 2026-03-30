import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getProfile, updateProfile } from "../controllers/profile.controller";

const router = Router();

router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, updateProfile);

export default router;