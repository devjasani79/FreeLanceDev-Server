const Gig = require("../models/Gigs");
const cloudinary = require("../utils/cloudinary");

// Helper to parse JSON strings or accept arrays directly
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

// @route POST /api/gigs
exports.createGig = async (req, res) => {
  try {
    const {
      title,
      desc,
      category,
      keywords,
      pricePlans, // JSON string or array
      faqs,       // JSON string or array
      requirements // JSON string or array
    } = req.body;

    if (!title || !desc || !category || !pricePlans) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const keywordList = keywords
      ? keywords.split(",").map((kw) => kw.trim().toLowerCase())
      : [];

    // Parse complex fields
    const parsedPricePlans = parseJSONorArray(pricePlans);
    const parsedFaqs = parseJSONorArray(faqs);
    const parsedRequirements = parseJSONorArray(requirements);

    if (!Array.isArray(parsedPricePlans) || parsedPricePlans.length === 0) {
      return res.status(400).json({ error: "pricePlans must be a non-empty array" });
    }

    // Handle uploads: 
    // Expecting 1 file for thumbnail (in req.files.gigThumbnail) and rest in req.files.gigImages (array)
    // The multer setup must handle fields accordingly, see note below.

    if (!req.files || !req.files.gigThumbnail || req.files.gigThumbnail.length === 0) {
      return res.status(400).json({ error: "Gig thumbnail image is required" });
    }

    const gigThumbnail = req.files.gigThumbnail[0].path; // single thumbnail URL
    const gigImages = req.files.gigImages ? req.files.gigImages.map(file => file.path) : [];

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
    console.error("❌ createGig error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};

// @route GET /api/gigs
exports.getAllGigs = async (req, res) => {
  try {
    const gigs = await Gig.find().populate("user", "name email role");
    res.status(200).json(gigs);
  } catch (err) {
    console.error("Fetch gigs error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// @route GET /api/gigs/:id
exports.getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate("user", "name role");
    if (!gig) return res.status(404).json({ msg: "Gig not found" });
    res.status(200).json(gig);
  } catch (err) {
    console.error("Get gig by ID error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// @route PUT /api/gigs/:id
exports.updateGig = async (req, res) => {
  try {
    // Find existing gig - restrict by user
    const gig = await Gig.findOne({ _id: req.params.id, user: req.user._id });
    if (!gig) return res.status(404).json({ msg: "Gig not found or unauthorized" });

    const {
      title,
      desc,
      category,
      keywords,
      pricePlans, 
      faqs,       
      requirements, 
    } = req.body;

    if (title) gig.title = title;
    if (desc) gig.desc = desc;
    if (category) gig.category = category;
    if (keywords)
      gig.keywords = keywords.split(",").map((kw) => kw.trim().toLowerCase());

    if (pricePlans) {
      const parsedPricePlans = parseJSONorArray(pricePlans);
      if (Array.isArray(parsedPricePlans) && parsedPricePlans.length > 0) {
        gig.pricePlans = parsedPricePlans;
      }
    }

    if (faqs) {
      const parsedFaqs = parseJSONorArray(faqs);
      gig.faqs = Array.isArray(parsedFaqs) ? parsedFaqs : gig.faqs;
    }

    if (requirements) {
      const parsedRequirements = parseJSONorArray(requirements);
      gig.requirements = Array.isArray(parsedRequirements) ? parsedRequirements : gig.requirements;
    }

    // Update gigThumbnail if new one uploaded
    if (req.files?.gigThumbnail && req.files.gigThumbnail.length > 0) {
      gig.gigThumbnail = req.files.gigThumbnail[0].path;
    }

    // Append new uploaded gigImages if provided
    if (req.files?.gigImages && req.files.gigImages.length > 0) {
      const newImages = req.files.gigImages.map(file => file.path);
      gig.gigImages.push(...newImages);
    }

    await gig.save();

    res.status(200).json({ msg: "Gig updated", gig });
  } catch (err) {
    console.error("Update gig error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// @route DELETE /api/gigs/:id
exports.deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!gig) return res.status(404).json({ msg: "Gig not found or unauthorized" });
    res.status(200).json({ msg: "Gig deleted" });
  } catch (err) {
    console.error("Delete gig error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// @route GET /api/gigs/my
exports.getMyGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ user: req.user._id }).populate(
      "user",
      "name email role"
    );
    res.status(200).json(gigs);
  } catch (err) {
    console.error("Get my gigs error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
