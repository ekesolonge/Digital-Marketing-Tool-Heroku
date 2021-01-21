require("dotenv").config();
const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate, manageUser } = require("../middleware/authorization"); // authorization middleware
const upload = require("../middleware/uploadImage"); // file upload
const s3 = require("../middleware/s3");
// import userControllers
const {
  getUsers,
  getUserById,
  deleteUser,
  createUser,
  editUser,
  updateProfile,
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

// CREATE A NEW USER (ADMIN)
router.post("/", authenticate, manageUser, createUser);

// EDIT USER (ADMIN)
router.put(
  "/:id",
  authenticate,
  manageUser,
  upload.single("image"),
  s3,
  editUser
);

// UPDATE PROFILE
router.put("/", authenticate, upload.single("image"), s3, updateProfile);

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
