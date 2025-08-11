const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reviewedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gig",
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ["communication", "quality", "value", "delivery", "overall"],
    default: "overall"
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ensure one review per order
reviewSchema.index({ order: 1 }, { unique: true });

// Index for efficient querying
reviewSchema.index({ reviewedUser: 1, gig: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema); 