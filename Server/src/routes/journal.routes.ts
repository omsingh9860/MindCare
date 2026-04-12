import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { createEntry, deleteEntry, listEntries, markJournalForAnalysis } from "../controllers/journal.controller.js";

const router = Router();

router.get("/", requireAuth, listEntries);
router.post("/", requireAuth, createEntry);
router.delete("/:id", requireAuth, deleteEntry);
router.post("/:id/mark-analysis", requireAuth, markJournalForAnalysis);

export default router;