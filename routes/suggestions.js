const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const {
  getSuggestions,
  createSuggestions,
  getSuggestionsById,
} = require("../controllers/suggestions");

// GET ALL Suggestions
router.get("/", authenticate, getSuggestions);

// GET Suggestions by ID
router.get("/:id", authenticate, getSuggestionsById);

// CREATE A NEW Suggestions
router.post("/", authenticate, createSuggestions);

module.exports = router;
