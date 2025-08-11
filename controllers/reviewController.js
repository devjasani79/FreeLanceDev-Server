const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");

// Create a review
const createReview = async (req, res) => {
  try {
    const { orderId, rating, comment, category = "overall" } = req.body;
    const reviewerId = req.user.id;

    // Validate order exists and user is the buyer
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.buyerId.toString() !== reviewerId) {
      return res.status(403).json({ msg: "Only buyers can leave reviews" });
    }

    if (order.status !== "Completed") {
      return res.status(400).json({ msg: "Can only review completed orders" });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ msg: "Review already exists for this order" });
    }

    // Create review
    const review = new Review({
      reviewer: reviewerId,
      reviewedUser: order.sellerId,
      gig: order.gigId,
      order: orderId,
      rating,
      comment,
      category
    });

    await review.save();

    // Populate references
    await review.populate([
      { path: "reviewer", select: "name email profilePic" },
      { path: "reviewedUser", select: "name email profilePic" },
      { path: "gig", select: "title category" }
    ]);

    // Update user's average rating
    await updateUserRating(order.sellerId);

    res.status(201).json({
      msg: "Review created successfully",
      review
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get reviews for a gig
const getGigReviews = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    let query = { gig: gigId, isPublic: true };
    
    // Filter by rating if provided
    if (rating) {
      query.rating = parseInt(rating);
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find(query)
      .populate("reviewer", "name email profilePic")
      .populate("reviewedUser", "name email profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { gig: gigId, isPublic: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating"
          }
        }
      }
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: [] };
    
    // Calculate rating distribution
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: stats.ratingDistribution.filter(r => r === rating).length
    }));

    res.json({
      reviews,
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        ratingDistribution: distribution
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Get gig reviews error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get reviews for a user
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ 
      reviewedUser: userId, 
      isPublic: true 
    })
      .populate("reviewer", "name email profilePic")
      .populate("gig", "title category gigThumbnail")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ 
      reviewedUser: userId, 
      isPublic: true 
    });

    // Calculate user's rating stats
    const ratingStats = await Review.aggregate([
      { $match: { reviewedUser: userId, isPublic: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 };

    res.json({
      reviews,
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update review (only reviewer can update)
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, category } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    if (review.reviewer.toString() !== userId) {
      return res.status(403).json({ msg: "Can only update your own reviews" });
    }

    // Update review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment, category },
      { new: true }
    ).populate([
      { path: "reviewer", select: "name email profilePic" },
      { path: "reviewedUser", select: "name email profilePic" },
      { path: "gig", select: "title category" }
    ]);

    // Update user's average rating
    await updateUserRating(review.reviewedUser);

    res.json({
      msg: "Review updated successfully",
      review: updatedReview
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete review (only reviewer can delete)
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    if (review.reviewer.toString() !== userId) {
      return res.status(403).json({ msg: "Can only delete your own reviews" });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update user's average rating
    await updateUserRating(review.reviewedUser);

    res.json({ msg: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Helper function to update user's average rating
const updateUserRating = async (userId) => {
  try {
    const ratingStats = await Review.aggregate([
      { $match: { reviewedUser: userId, isPublic: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" }
        }
      }
    ]);

    const averageRating = ratingStats[0]?.averageRating || 0;
    
    await User.findByIdAndUpdate(userId, {
      rating: Math.round(averageRating * 10) / 10
    });
  } catch (error) {
    console.error("Update user rating error:", error);
  }
};

module.exports = {
  createReview,
  getGigReviews,
  getUserReviews,
  updateReview,
  deleteReview
}; 