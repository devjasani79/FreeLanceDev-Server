const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 5,
    },
    category: {
      type: String,
      required: true,
      enum: ["design", "development", "marketing", "business", "writing", "video", "music"], // extend later
    },
    images: {
      type: [String], // Cloudinary URLs
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
    deliveryTime: {
      type: Number, // in days
      required: true,
    },
    revisions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

gigSchema.index({ keywords: 1, title: 1, category: 1 }); // optional indexing for search

module.exports = mongoose.model("Gig", gigSchema);
