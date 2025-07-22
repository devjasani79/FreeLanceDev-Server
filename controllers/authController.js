const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const sendEmail = require("../utils/passwordReset");

//  Register
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role)
    return res.status(400).json({ msg: "All fields are required" });

  if (!["client", "freelancer"].includes(role))
    return res.status(400).json({ msg: "Invalid role" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      msg: "User registered",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

//  Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ msg: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Incorrect email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

//  /me (protected)
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Get /me error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

//  GET /freelancers (public)
exports.getAllFreelancers = async (req, res) => {
  try {
    const freelancers = await User.find({ role: "freelancer" }).select(
      "name bio skills rating role"
    );

    res.status(200).json(freelancers);
  } catch (err) {
    console.error("Fetch freelancers error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// @route   PUT /api/auth/update
exports.updateMyProfile = async (req, res) => {
  const updates = req.body;

  // Prevent role/email/password being updated here unless explicitly allowed
  const restrictedFields = ["role", "email", "password"];
  for (let field of restrictedFields) {
    if (updates[field]) {
      return res.status(400).json({ msg: `Cannot update field: ${field}` });
    }
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      msg: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// @route PUT /api/auth/profile-pic
exports.updateProfilePic = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ msg: "No image uploaded" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: req.file.path },
      { new: true }
    ).select("-password");

    res.status(200).json({
      msg: "Profile picture updated",
      user,
    });
  } catch (err) {
    console.error("Profile pic update error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
// @route   DELETE /api/auth/delete
exports.deleteMyAccount = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);

    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ msg: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// @route POST /api/auth/request-reset
exports.requestReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    await PasswordReset.deleteMany({ email }); // clear old OTPs
    await PasswordReset.create({ email, otp, expiresAt });

    try {
      await sendEmail(email, `Your OTP is: ${otp}`);
      res.status(200).json({ msg: "OTP sent to email" });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  } catch (err) {
    console.error("OTP request error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// @route POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ msg: "All fields are required" });

  try {
    const record = await PasswordReset.findOne({ email });
    if (!record || record.otp !== otp || record.expiresAt < new Date()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await PasswordReset.deleteMany({ email });

    res.status(200).json({ msg: "Password reset successful" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};