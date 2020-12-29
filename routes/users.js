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

module.exports = router;
