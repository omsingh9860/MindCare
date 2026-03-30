import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { createEntry, deleteEntry, listEntries } from "../controllers/journal.controller";

const router = Router();

router.get("/", requireAuth, listEntries);
router.post("/", requireAuth, createEntry);
router.delete("/:id", requireAuth, deleteEntry);

export default router;