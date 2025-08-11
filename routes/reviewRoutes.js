const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const allowRoles = require("../middleware/allowRoles");
const {
  createReview,
  getGigReviews,
  getUserReviews,
  updateReview,
  deleteReview
} = require("../controllers/reviewController");

// Public routes (no authentication required)
router.get("/gig/:gigId", getGigReviews);
router.get("/user/:userId", getUserReviews);

// Protected routes
router.use(verifyToken);

// Create review (clients only)
router.post("/", allowRoles(["client"]), createReview);

// Update review (only reviewer can update)
router.put("/:reviewId", updateReview);

// Delete review (only reviewer can delete)
router.delete("/:reviewId", deleteReview);

module.exports = router; 