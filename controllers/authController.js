const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const sendEmail = require("../utils/passwordReset");

// Helper: Generate JWT Token (expires in 1h)
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

// Helper: Clean user object to avoid sending sensitive data
function cleanUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    skills: user.skills,
    rating: user.rating,
    profilePic: user.profilePic,
  };
}

// Register User
exports.registerUser = async (req, res) => {
  // For multipart, req.body keys are strings, req.file has uploaded file info
  const { name, email, password, role, bio } = req.body;

  let skills = [];
  if (req.body.skills) {
    try {
      skills = JSON.parse(req.body.skills);
    } catch {
      // fallback: comma separated string parsing
      skills = req.body.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  if (!name || !email || !password || !role)
    return res.status(400).json({ success: false, msg: "All fields are required" });

  if (!["client", "freelancer"].includes(role))
    return res.status(400).json({ success: false, msg: "Invalid role" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUserData = {
      name,
      email,
      password: hashedPassword,
      role,
      bio: bio || '',
      skills,
    };

    if (req.file && req.file.path) {
      newUserData.profilePic = req.file.path; // multer stores url/path here
    }

    const user = await User.create(newUserData);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      msg: "User registered successfully",
      token,
      user: cleanUser(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};


// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, msg: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, msg: "Incorrect email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, msg: "Incorrect email or password" });

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      msg: "Login successful",
      token,
      user: cleanUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Get My Profile (/me)
exports.getMyProfile = async (req, res) => {
  try {
    if(!req.user)
      return res.status(401).json({ success: false, msg: "Authorization required" });

    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ success: false, msg: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Get /me error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Get All Freelancers
exports.getAllFreelancers = async (req, res) => {
  try {
    const freelancers = await User.find({ role: "freelancer" }).select(
      "name bio skills rating role profilePic"
    );
    return res.status(200).json({ success: true, freelancers });
  } catch (err) {
    console.error("Fetch freelancers error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Update My Profile (protected)
exports.updateMyProfile = async (req, res) => {
  const updates = req.body;

  // Prevent email, password, role from being updated here
  const restrictedFields = ["role", "email", "password"];
  for (let field of restrictedFields) {
    if (updates.hasOwnProperty(field)) {
      return res.status(400).json({ success: false, msg: `Cannot update field: ${field}` });
    }
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ success: false, msg: "User not found" });

    return res.status(200).json({
      success: true,
      msg: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Update Profile Pic
exports.updateProfilePic = async (req, res) => {
  try {
    if (!req.file || !req.file.path)
      return res.status(400).json({ success: false, msg: "No image uploaded" });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: req.file.path },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      msg: "Profile picture updated",
      user,
    });
  } catch (err) {
    console.error("Profile pic update error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Delete My Account
exports.deleteMyAccount = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);

    if (!deletedUser)
      return res.status(404).json({ success: false, msg: "User not found" });

    // Optionally: here you should delete all gigs, reviews, orders related to user

    return res.status(200).json({ success: true, msg: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Request Password Reset OTP
exports.requestReset = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, msg: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, msg: "User not found" });

    await PasswordReset.deleteMany({ email }); // clear old OTPs
    await PasswordReset.create({ email, otp, expiresAt });

    try {
      await sendEmail(email, `Your OTP is: ${otp}`);
      return res.status(200).json({ success: true, msg: "OTP sent to email" });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      return res.status(500).json({ success: false, error: "Failed to send OTP" });
    }
  } catch (err) {
    console.error("OTP request error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Verify OTP and Reset Password
exports.verifyOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ success: false, msg: "All fields are required" });

  try {
    const record = await PasswordReset.findOne({ email });
    if (
      !record ||
      record.otp !== otp ||
      record.expiresAt < new Date()
    ) {
      return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await PasswordReset.deleteMany({ email });

    return res.status(200).json({ success: true, msg: "Password reset successful" });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
