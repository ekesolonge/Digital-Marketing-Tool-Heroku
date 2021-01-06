const express = require('express'); // express module
const router = express.Router(); // router
const { authenticate } = require('../middleware/authorization'); // authorization middleware
const {
  getPayment,
  deletePayment,
  createPayment,
  createPlan,
  makePayment,
  verifyPayment,
} = require('../controllers/payment');

// GET ALL Payment
router.get('/', authenticate, getPayment);

// DELETE Payment
router.delete('/:id', authenticate, deletePayment);

// CREATE A NEW Payment
router.post('/', authenticate, createPayment);

//Create New Plan
router.post('/create-plan', authenticate, createPlan);

//Make Payment
router.post('/pay', authenticate, makePayment);

//Verify Payment
router.get('/verify-payment', authenticate, verifyPayment);

module.exports = router;
