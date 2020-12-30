const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const {
  getSuggestions,
  createSuggestions,
} = require("../controllers/suggestions");

// GET ALL Suggestions
router.get("/", authenticate, getSuggestions);

// CREATE A NEW Suggestions
router.post("/", authenticate, createSuggestions);

module.exports = router;
