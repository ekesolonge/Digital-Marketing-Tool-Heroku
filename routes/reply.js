const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const { getReply, createReply } = require("../controllers/reply");

// GET ALL Reply
router.get("/", authenticate, getReply);

// CREATE A NEW Reply
router.post("/:id", authenticate, createReply);

module.exports = router;
