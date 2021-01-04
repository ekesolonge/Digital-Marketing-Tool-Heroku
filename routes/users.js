require("dotenv").config();
const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate, manageUser } = require("../middleware/authorization"); // authorization middleware
const upload = require("../middleware/uploadImage"); // file upload
// import userControllers
const {
  getUsers,
  getUserById,
  deleteUser,
  createUser,
  editUser,
  signup,
  login,
  activateAccount,
  resetPassword,
  handleResetPassword,
  setPassword,
} = require("../controllers/userControllers");

// GET ALL USERS
router.get("/", authenticate, manageUser, getUsers);

// GET ALL USERS BY ID
router.get("/:id", authenticate, manageUser, getUserById);

// DELETE USERS
router.delete("/:id", authenticate, manageUser, deleteUser);

// CREATE A NEW USER
router.post("/", authenticate, manageUser, createUser);

// EDIT USER
router.put("/:id", authenticate, manageUser, upload.single("image"), editUser);

// SIGNUP
router.post("/signup", signup);

// LOGIN
router.post("/login", login);

// Activate User Account
router.get("/auth/activation/:userId/:otpCode", activateAccount);

// Reset Password
router.post("/resetPassword", resetPassword);

// Handle Password Reset
router.get("/auth/reset/:userId/:otpCode", handleResetPassword);

// Set New Password
router.post("/setNewPassword", setPassword);

module.exports = router;
