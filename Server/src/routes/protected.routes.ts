import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/secret", requireAuth, (req, res) => {
  res.json({ ok: true, message: "You can see this only when logged in" });
});

export default router;