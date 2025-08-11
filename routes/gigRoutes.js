const express = require("express");
const router = express.Router();
const {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
  getMyGigs,
} = require("../controllers/gigController");
const upload = require("../middleware/multer");      // multer middleware updated for fields()
const verifyToken = require("../middleware/verifyToken");
const allowRoles = require("../middleware/allowRoles");

// Public routes
router.get('/', getAllGigs);

// Authenticated freelancer's gigs - place before /:id to avoid conflicts
router.get('/my', verifyToken, allowRoles(['freelancer']), getMyGigs);

// Single gig details route
router.get('/:id', getGigById);

// Protected routes

// Create gig: expect separate upload fields, one thumbnail + multiple images
router.post(
  '/',
  verifyToken,
  allowRoles(['freelancer']),
  upload.fields([
    { name: "gigThumbnail", maxCount: 1 },
    { name: "gigImages", maxCount: 10 }
  ]),
  createGig
);

// Update Gig (PATCH)
router.patch(
  "/:id",
  verifyToken,
  allowRoles(["freelancer"]),
  upload.fields([
    { name: "gigThumbnail", maxCount: 1 },
    { name: "gigImages", maxCount: 10 }
  ]),
  updateGig
);


// Delete gig
router.delete('/:id', verifyToken, allowRoles(['freelancer']), deleteGig);

module.exports = router;




// // Update Gig (PATCH)
// router.patch(
//   "/:id",
//   verifyToken,
//   allowRoles(["freelancer"]),
//   upload.fields([
//     { name: "gigThumbnail", maxCount: 1 },
//     { name: "gigImages", maxCount: 10 }
//   ]),
//   updateGig
// );

// // Delete Gig
// router.delete("/:id", verifyToken, allowRoles(["freelancer"]), deleteGig);

// module.exports = router;
