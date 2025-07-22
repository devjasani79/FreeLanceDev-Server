const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["client", "freelancer"],
    required: true,
  },
  bio: { type: String },
  skills: [String],
  rating: { type: Number, default: 0 },
profilePic: {
  type: String,
  default: "https://res.cloudinary.com/demo/image/upload/v1700000000/default-avatar.png",
},
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
