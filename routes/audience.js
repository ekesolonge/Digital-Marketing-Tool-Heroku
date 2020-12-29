const express = require("express"); // express module
const router = express.Router(); // router
const connection = require("../models/db"); // database module
const { authenticate } = require("../middleware/authorization"); // authorization middleware

const {
  getUsers,
  getUserById,
  deleteUser,
  createUser,
  editUser,
 
} = require("../controllers/audienceController");



// GET ALL USERS
router.get("/", authenticate, manageUser, getUsers);

// GET ALL USERS BY ID
router.get("/:id", authenticate, manageUser, getUserById);

// DELETE USERS
router.delete("/:id", authenticate, manageUser, deleteUser);

// CREATE A NEW USER
router.post("/", authenticate, manageUser, createUser);

// EDIT USER
router.put("/:id", authenticate, manageUser, editUser);


module.exports = router;
