const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate, manageRole } = require("../middleware/authorization"); // authorization middleware

// import roleController
const {
  getRoles,
  getRoleById,
  deleteRole,
  createRole,
  editRole,
  assignRole,
} = require("../controllers/roleController");

// VIEW ROLES
router.get("/", authenticate, manageRole, getRoles);

// VIEW ROLES BY ID
router.get("/:id", authenticate, manageRole, getRoleById);

// DELETE ROLES
router.delete("/:id", authenticate, manageRole, deleteRole);

// CREATE ROLES
router.post("/", authenticate, manageRole, createRole);

// EDIT ROLES
router.put("/:id", authenticate, manageRole, editRole);

// ASSIGN ROLE TO USER
router.post(
  "/assignRole/:roleId/:userId",
  authenticate,
  manageRole,
  assignRole
);

module.exports = router;
