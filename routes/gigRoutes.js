const express = require("express");
const router = express.Router();
const {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
} = require("../controllers/gigController");

const verifyToken = require("../middleware/verifyToken");
const allowRoles = require("../middleware/allowRoles");

// Public
router.get("/", getAllGigs);
router.get("/:id", getGigById);

// Protected (Freelancer Only)
router.post("/", verifyToken, allowRoles(["freelancer"]), createGig);
router.put("/:id", verifyToken, allowRoles(["freelancer"]), updateGig);
router.delete("/:id", verifyToken, allowRoles(["freelancer"]), deleteGig);

module.exports = router;
