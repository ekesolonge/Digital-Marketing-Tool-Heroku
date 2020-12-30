const express = require("express"); // express module
const router = express.Router(); // router

// GET ALL USERS
router.get("/", (req, res) => res.send("Welcome to my API"));

module.exports = router;
