const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const {
  getSubscriberGroup,
  getSubscriberGroupById,
  deleteSubscriberGroup,
  createSubscriberGroup,
  editSubscriberGroup,
  assignSubscriberGroup,
} = require("../controllers/subscriberGroup");

// GET ALL SubscriberGroup
router.get("/", authenticate, getSubscriberGroup);

// GET ALL SubscriberGroup BY ID
router.get("/:id", authenticate, getSubscriberGroupById);

// DELETE SubscriberGroup
router.delete("/:id", authenticate, deleteSubscriberGroup);

// CREATE A NEW Subscriber
router.post("/", authenticate, createSubscriberGroup);

// EDIT SubscriberGroup
router.put("/:id", authenticate, editSubscriberGroup);

// Assign SubscriberGroup
router.post(
  "/assignGroup/:audienceId/:groupId",
  authenticate,
  assignSubscriberGroup
);

module.exports = router;
