// Importing modules
import express from "express";
import Ok from "../responses/Ok.response.js";

// Making the express router
const router = express.Router();

/*
    @route GET /api/health
    @desc checks server health
    @access Public
*/
router.get((req, res) => {
   
    // sending Ok as response
    Ok(res, "Server is healthy");

});

// exporting the router
export default router;