const mongoose = require("mongoose");

const pricePlanSchema = new mongoose.Schema({
  tier: { type: String, enum: ["Basic", "Standard", "Premium"], required: true },
  price: { type: Number, required: true, min: 5 },
  deliveryTime: { type: Number, required: true }, // days
  revisions: { type: Number, default: 0 },
  features: { type: [String], default: [] },
});

const faqSchema = new mongoose.Schema({
  question: { type: String },
  answer: { type: String },
});

const gigSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["design", "development", "marketing", "business", "writing", "video", "music"],
    },
    gigThumbnail: { type: String, required: true }, // single thumbnail image URL
    gigImages: { type: [String], default: [] },      // multiple additional images URLs

    keywords: { type: [String], default: [] },

    pricePlans: { type: [pricePlanSchema], required: true },

    faqs: { type: [faqSchema], default: [] },

    requirements: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gig", gigSchema);
