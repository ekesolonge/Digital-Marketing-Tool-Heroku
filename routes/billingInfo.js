const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const {
  createBillingInfo,
  editBillingInfo,
} = require("../controllers/billingInfo");

// CREATE A NEW BillingInfo
router.post("/", authenticate, createBillingInfo);

// EDIT BillingInfo
router.put("/:id", authenticate, editBillingInfo);

module.exports = router;
