const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const upload = require("../middleware/uploadCSV");
const {
  getAudience,
  getAudienceById,
  getAudienceByGroup,
  deleteAudience,
  createAudience,
  editAudience,
  importContacts,
} = require("../controllers/audienceController");

// GET ALL Audience
router.get("/", authenticate, getAudience);

// GET Audience BY ID
router.get("/:id", authenticate, getAudienceById);

// GET Audience BY Group
router.get("/group/:id", authenticate, getAudienceByGroup);

// DELETE Audience
router.delete("/:id", authenticate, deleteAudience);

// CREATE A NEW Audience
router.post("/", authenticate, createAudience);

// EDIT Audience
router.put("/:id", authenticate, editAudience);

// Import Contacts
router.post("/csv", authenticate, upload.single("file"), importContacts);

module.exports = router;
