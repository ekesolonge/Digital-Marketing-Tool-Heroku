const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const {
  getStickyNote,
  saveStickyNote,
  getStickyNoteById,
} = require("../controllers/stickyNote");

// GET StickyNote
router.get("/", authenticate, getStickyNote);

// GET StickyNote by id
router.get("/:id", authenticate, getStickyNoteById);

// Save StickyNote
router.post("/", authenticate, saveStickyNote);

module.exports = router;
