const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware

// import contactUsController
const {
  sendContact,
  getContacts,
  getContactById,
  deleteContact,
} = require("../controllers/contactUsController");

// CONTACT US
router.post("/", sendContact);

// GET CONTACTS
router.get("/", authenticate, getContacts);

// GET CONTACT BY ID
router.get("/:id", authenticate, getContactById);

// DELETE CONTACTS
router.delete("/:id", authenticate, deleteContact);

module.exports = router;
