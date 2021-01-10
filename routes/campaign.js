const express = require("express"); // express module
const router = express.Router(); // router
const { authenticate } = require("../middleware/authorization"); // authorization middleware
const {
  getCampaign,
  getCampaignById,
  deleteCampaign,
  createCampaign,
  editCampaign,
  sendCampaign,
} = require("../controllers/campaignController");

// GET ALL Campaign
router.get("/", authenticate, getCampaign);

// GET ALL Campaign BY ID
router.get("/:id", authenticate, getCampaignById);

// DELETE Campaign
router.delete("/:id", authenticate, deleteCampaign);

// CREATE A NEW Campaign
router.post("/", authenticate, createCampaign);

// EDIT Campaign
router.put("/:id", authenticate, editCampaign);

// Send Campaign
router.post("/sendCampaign/:id", authenticate, sendCampaign);

module.exports = router;
