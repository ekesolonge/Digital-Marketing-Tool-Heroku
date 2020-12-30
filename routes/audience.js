const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const {
  getAudience,
  getAudienceById,
  deleteAudience,
  createAudience,
  editAudience,
} = require("../controllers/AudienceController");

// GET ALL Audience
router.get("/", authenticate, getAudience);

// GET ALL Audience BY ID
router.get("/:id", authenticate, getAudienceById);

// DELETE Audience
router.delete("/:id", authenticate, deleteAudience);

// CREATE A NEW Audience
router.post("/", authenticate, createAudience);

// EDIT Audience
router.put("/:id", authenticate, editAudience);

module.exports = router;
