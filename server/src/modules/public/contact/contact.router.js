// Importing modules
import express from "express";
import ContactController from "./contact.controller.js";
import { contactValidators } from "./contact.validator.js";

// making the router
const router = express.Router();

// creating a contact controller instance
const contactController = new ContactController();

/*
    @route POST /api/contact
    @desc Submit contact form
    @access Public
*/
router.post("/", contactValidators, contactController.contact);

// exporting the router
export default router;
