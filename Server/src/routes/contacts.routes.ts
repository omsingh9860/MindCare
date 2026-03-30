import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { createContact, deleteContact, listContacts, updateContact } from "../controllers/contacts.controller";

const router = Router();

router.get("/", requireAuth, listContacts);
router.post("/", requireAuth, createContact);
router.put("/:id", requireAuth, updateContact);
router.delete("/:id", requireAuth, deleteContact);

export default router;