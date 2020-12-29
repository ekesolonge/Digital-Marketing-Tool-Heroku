const express = require("express"); // express module
const router = express.Router(); // router
const {
  authenticate,
  managePermission,
} = require("../middleware/authorization"); // authorization middleware

// import PermissionController
const {
  getPermissions,
  getPermissionById,
  deletePermission,
  createPermission,
  editPermission,
  assignPermission,
} = require("../controllers/PermissionController");

// VIEW PermissionS
router.get("/", authenticate, managePermission, getPermissions);

// VIEW PermissionS BY ID
router.get("/:id", authenticate, managePermission, getPermissionById);

// DELETE PermissionS
router.delete("/:id", authenticate, managePermission, deletePermission);

// CREATE PermissionS
router.post("/", authenticate, managePermission, createPermission);

// EDIT PermissionS
router.put("/:id", authenticate, managePermission, editPermission);

// ASSIGN Permission TO USER
router.post(
  "/assignPermission/:roleId/:permissionId",
  authenticate,
  managePermission,
  assignPermission
);

module.exports = router;
