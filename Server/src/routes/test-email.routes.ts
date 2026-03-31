import { Router } from "express";
import { sendCrisisEmail } from "../services/mailer";

const router = Router();

router.get("/test-email", async (_req, res) => {
  try {
    await sendCrisisEmail("bcoc772@gmail.com", {
      userName: "MindCare Test User",
      triggeredAt: new Date(),
      timezone: "IST",
      delaySeconds: 30,
    });

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err?.message || "Email failed" });
  }
});

export default router;