const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware

// import emailTemplateControllers
const {
  getEmailTemplates,
  getEmailTemplateDesigns,
  getEmailTemplateById,
  createEmailTemplate,
  editEmailTemplate,
  deleteEmailTemplate,
  testEmailTemplate,
} = require("../controllers/emailTemplateController");

// GET EMAIL TEMPLATES
router.get("/", authenticate, getEmailTemplates);

// GET EMAIL TEMPLATES
router.get("/designs", authenticate, getEmailTemplateDesigns);

// GET EMAIL TEMPLATES BY ID
router.get("/:id", authenticate, getEmailTemplateById);

// CREATE NEW EMAIL TEMPLATE
router.post("/", authenticate, createEmailTemplate);

// EDIT EMAIL TEMPLATES
router.put("/:id", authenticate, editEmailTemplate);

// DELETE EMAIL TEMPLATE
router.delete("/:id", authenticate, deleteEmailTemplate);

// TEST EMAIL TEMPLATE
router.post("/testMail", authenticate, testEmailTemplate);

module.exports = router;
