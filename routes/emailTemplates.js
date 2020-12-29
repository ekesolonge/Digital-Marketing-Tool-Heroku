const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware

// import emailTemplateControllers
const {
  getEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  editEmailTemplate,
  deleteEmailTemplate,
} = require("../controllers/emailTemplateController");

// GET EMAIL TEMPLATES
router.get("/", authenticate, getEmailTemplates);

// GET EMAIL TEMPLATES BY ID
router.get("/:id", authenticate, getEmailTemplateById);

// CREATE NEW EMAIL TEMPLATE
router.post("/", authenticate, createEmailTemplate);

// EDIT EMAIL TEMPLATES
router.put("/:id", authenticate, editEmailTemplate);

// DELETE EMAIL TEMPLATE
router.delete("/:id", authenticate, deleteEmailTemplate);

module.exports = router;
