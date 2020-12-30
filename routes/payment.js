const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const {
  getPayment,
  deletePayment,
  createPayment,
} = require("../controllers/payment");

// GET ALL Payment
router.get("/", authenticate, getPayment);

// DELETE Payment
router.delete("/:id", authenticate, deletePayment);

// CREATE A NEW Payment
router.post("/", authenticate, createPayment);

module.exports = router;
