// Importing modules
import express from "express";
import JournalEntriesController from "./journalEntries.controller.js";
import { createJournalEntryValidators } from "./journalEntries.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a journal entries controller instance
const controller = new JournalEntriesController();

/*
    @route POST /api/journal-entries
    @desc Create a new manual journal entry
    @access Private (requires journalEntries.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("journalEntries.create"), createJournalEntryValidators, controller.createJournalEntry);

router.get("/", authMiddleware, permissionMiddleware("journalEntries.view"), controller.listJournalEntries);

// exporting the router
export default router;
