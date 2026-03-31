import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { createContact, deleteContact, listContacts, updateContact } from "../controllers/contacts.controller.js";

const router = Router();

router.get("/", requireAuth, listContacts);
router.post("/", requireAuth, createContact);
router.put("/:id", requireAuth, updateContact);
router.delete("/:id", requireAuth, deleteContact);

export default router;