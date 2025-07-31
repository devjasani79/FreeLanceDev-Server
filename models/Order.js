const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // Who buys (client)
  buyerId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Who delivers (freelancer)
  sellerId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Which gig/package is sold
  gigId:         { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },

  // Which pricing tier was ordered (for multi-tier gigs)
  plan: {
    tier:           { type: String, enum: ["Basic", "Standard", "Premium"], required: true },
    price:          { type: Number, required: true },
    deliveryTime:   { type: Number, required: true }, // in days
    revisions:      { type: Number, default: 0 },     // allowed
    features:       [String],                         // optional, for extra info
  },

  // Status tracking
  status:          { type: String, enum: ["Pending", "In Progress", "Delivered", "Completed", "Cancelled"], default: "Pending" },

  // Requirements sent by client (description, instructions)
  requirements:    { type: String },

  // Delivery uploads (array of file URLs) — optional in early MVP
  deliveryFiles:   { type: [String], default: [] },

  // Revision rounds left
  revisionsLeft:   { type: Number, default: 0 },

  // Payment fields (future use)
  amount:          { type: Number, required: true },
  paymentStatus:   { type: String, enum: ["Unpaid", "Paid", "Refunded"], default: "Unpaid" }, // you can update this when Stripe is added
  paymentIntentId: { type: String }, // for Stripe integration later, can ignore for now

  // Review/feedback (left by client once completed)
  feedback: {
    rating:          { type: Number, min: 1, max: 5 },
    comment:         { type: String },
  },

  createdAt:       { type: Date, default: Date.now },
  updatedAt:       { type: Date, default: Date.now }
},{ timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
