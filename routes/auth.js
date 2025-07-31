const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllFreelancers,
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  requestReset,
  verifyOtp,
    updateProfilePic,
} = require("../controllers/authController");
const verifyToken = require("../middleware/verifyToken");

// Public
const upload = require('../middleware/multer');

router.post('/register', upload.single('profilePic'), registerUser);

router.post("/login", loginUser);
router.get("/freelancers", getAllFreelancers);
router.post("/request-reset", requestReset);
router.post("/verify-otp", verifyOtp);

// Protected
router.get("/me", verifyToken, getMyProfile);
router.put("/update", verifyToken, updateMyProfile);
router.delete("/delete", verifyToken, deleteMyAccount);
router.put("/profile-pic", verifyToken, upload.single("image"), updateProfilePic);
module.exports = router;
