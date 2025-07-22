const Gig = require("../models/Gigs");

// @route POST /api/gigs
exports.createGig = async (req, res) => {
  try {
    const gig = await Gig.create({
      ...req.body,
      user: req.user._id,
    });
    res.status(201).json({ msg: "Gig created", gig });
  } catch (err) {
    console.error("Create gig error:", err);
    res.status(500).json({ error: "Server error" });
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
    const gig = await Gig.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!gig) return res.status(404).json({ msg: "Gig not found or unauthorized" });
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
