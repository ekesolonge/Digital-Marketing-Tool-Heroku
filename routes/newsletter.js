const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware

// import newsletterControllers
const {
  subscribe,
  getNewsletters,
  getNewsletterById,
  deleteNewsletter,
  sendNewsletter,
} = require("../controllers/newsletterController");

// subscribe to newsletter
router.post("/", subscribe);

// GET
router.get("/", authenticate, getNewsletters);

// Get by id
router.get("/:id", authenticate, getNewsletterById);

// DELETE
router.delete("/:id", authenticate, deleteNewsletter);

// Send Newsletter
router.post("/sendNewsletter", authenticate, sendNewsletter);

module.exports = router;
