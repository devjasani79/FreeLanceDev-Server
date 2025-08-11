const Gig = require("../models/Gigs");
const cloudinary = require("../utils/cloudinary");

// Helper: Safely parse JSON string or return array directly
const parseJSONorArray = (input) => {
  if (!input) return [];
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch (e) {
      return [];
    }
  }
  return input;
};

// Helper: Unified error response
const handleError = (res, statusCode, message, error = null) => {
  console.error(`❌ ${message}`, error || '');
  return res.status(statusCode).json({ error: message });
};

/**
 * @route   POST /api/gigs
 * @desc    Create a new gig
 * @access  Private
 */
exports.createGig = async (req, res) => {
  try {
    const {
      title,
      desc,
      category,
      keywords,
      pricePlans,
      faqs,
      requirements,
    } = req.body;

    // Basic validation
    if (!title || !desc || !category || !pricePlans) {
      return handleError(res, 400, "Missing required fields");
    }

    // Process fields
    const keywordList = keywords
      ? keywords.split(",").map((kw) => kw.trim().toLowerCase())
      : [];

    const parsedPricePlans = parseJSONorArray(pricePlans);
    const parsedFaqs = parseJSONorArray(faqs);
    const parsedRequirements = parseJSONorArray(requirements);

    if (!Array.isArray(parsedPricePlans) || parsedPricePlans.length === 0) {
      return handleError(res, 400, "pricePlans must be a non-empty array");
    }

    // File uploads
    const gigThumbnail = req.files?.gigThumbnail?.[0]?.path;
    if (!gigThumbnail) {
      return handleError(res, 400, "Gig thumbnail image is required");
    }

    const gigImages = req.files?.gigImages
      ? req.files.gigImages.map((file) => file.path)
      : [];

    // Create gig
    const gig = await Gig.create({
      user: req.user._id,
      title,
      desc,
      category,
      keywords: keywordList,
      gigThumbnail,
      gigImages,
      pricePlans: parsedPricePlans,
      faqs: parsedFaqs,
      requirements: parsedRequirements,
    });

    return res.status(201).json({ msg: "Gig created successfully ✅", gig });
  } catch (err) {
    return handleError(res, 500, "Server error while creating gig", err);
  }
};

/**
 * @route   GET /api/gigs
 * @desc    Get all gigs
 * @access  Public
 */
exports.getAllGigs = async (req, res) => {
  try {
    const gigs = await Gig.find().populate("user", "name email role");
    res.status(200).json(gigs);
  } catch (err) {
    return handleError(res, 500, "Failed to fetch all gigs", err);
  }
};

/**
 * @route   GET /api/gigs/:id
 * @desc    Get gig by ID
 * @access  Public
 */
exports.getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate("user", "name role");
    if (!gig) return handleError(res, 404, "Gig not found");
    res.status(200).json(gig);
  } catch (err) {
    return handleError(res, 500, "Failed to fetch gig by ID", err);
  }
};
// @route   PATCH /api/gigs/:id
// @desc    Update an existing gig (supports dynamic fields, image deletion, uploads)
// @access  Private
exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findOne({ _id: req.params.id, user: req.user._id });
    if (!gig) return handleError(res, 404, "Gig not found or unauthorized");

    const {
      title,
      desc,
      category,
      keywords,
      pricePlans,
      faqs,
      requirements,
      deleteImages // Optional array of image URLs to remove
    } = req.body;

    // --- Basic fields update ---
    if (title !== undefined) gig.title = title;
    if (desc !== undefined) gig.desc = desc;
    if (category !== undefined) gig.category = category;
    if (keywords !== undefined) {
      gig.keywords = keywords
        ? keywords.split(",").map((kw) => kw.trim().toLowerCase())
        : [];
    }

    // --- Structured fields ---
    if (pricePlans !== undefined) {
      const parsed = parseJSONorArray(pricePlans);
      if (Array.isArray(parsed)) gig.pricePlans = parsed;
    }

    if (faqs !== undefined) {
      const parsed = parseJSONorArray(faqs);
      if (Array.isArray(parsed)) gig.faqs = parsed;
    }

    if (requirements !== undefined) {
      const parsed = parseJSONorArray(requirements);
      if (Array.isArray(parsed)) gig.requirements = parsed;
    }

    // --- Handle image updates ---
    if (req.files?.gigThumbnail?.[0]) {
      gig.gigThumbnail = req.files.gigThumbnail[0].path;
    }

    if (req.files?.gigImages?.length > 0) {
      const newImages = req.files.gigImages.map((file) => file.path);
      gig.gigImages.push(...newImages);
    }

    // --- Handle image deletions ---
    if (deleteImages && Array.isArray(deleteImages)) {
      for (const imageUrl of deleteImages) {
        // Remove from gigImages array
        gig.gigImages = gig.gigImages.filter((img) => img !== imageUrl);
        
        // Optionally delete from cloud storage if needed
        await cloudinary.uploader.destroy(imageUrl); // Uncomment if using Cloudinary
      }
      // If you want to delete the gigThumbnail as well
      if (gig.gigThumbnail && deleteImages.includes(gig.gigThumbnail)) {
        await cloudinary.uploader.destroy(gig.gigThumbnail); // Uncomment if using Cloudinary
        gig.gigThumbnail = null; // Clear the thumbnail if deleted
      }
    
    }


    await gig.save();
    res.status(200).json({ msg: "Gig updated successfully ✅", gig });

  } catch (err) {
    return handleError(res, 500, "Server error while updating gig", err);
  }
};


/**
 * @route   DELETE /api/gigs/:id
 * @desc    Delete a gig
 * @access  Private
 */
exports.deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!gig) return handleError(res, 404, "Gig not found or unauthorized");
    res.status(200).json({ msg: "Gig deleted successfully 🗑️" });
  } catch (err) {
    return handleError(res, 500, "Server error while deleting gig", err);
  }
};

/**
 * @route   GET /api/gigs/my
 * @desc    Get gigs created by logged-in user
 * @access  Private
 */
exports.getMyGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ user: req.user._id }).populate(
      "user",
      "name email role"
    );
    res.status(200).json(gigs);
  } catch (err) {
    return handleError(res, 500, "Server error while fetching user gigs", err);
  }
};
