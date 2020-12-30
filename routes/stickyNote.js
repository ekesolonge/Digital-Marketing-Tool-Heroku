const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const {
  getStickyNote,
  createStickyNote,
  editStickyNote,
} = require("../controllers/stickyNote");

// GET ALL StickyNote
router.get("/", authenticate, getStickyNote);

// CREATE A NEW StickyNote
router.post("/", authenticate, createStickyNote);

// EDIT StickyNote
router.put("/:id", authenticate, editStickyNote);

module.exports = router;
