const Order = require("../models/Order");
const User = require("../models/User");
const Gigs = require("../models/Gigs");
const Review = require("../models/Review");

// Create new order
const createOrder = async (req, res) => {
  try {
    const { gigId, plan, requirements } = req.body;
    const buyerId = req.user.id;

    // Validate gig exists
    const gig = await Gigs.findById(gigId).populate("user");
    if (!gig) {
      return res.status(404).json({ msg: "Gig not found" });
    }

    // Validate plan exists in gig
    const selectedPlan = gig.pricePlans.find(p => p.tier === plan.tier);
    if (!selectedPlan) {
      return res.status(400).json({ msg: "Invalid plan selected" });
    }

    // Create order
    const order = new Order({
      buyerId,
      sellerId: gig.user._id,
      gigId,
      plan: {
        tier: selectedPlan.tier,
        price: selectedPlan.price,
        deliveryTime: selectedPlan.deliveryTime,
        revisions: selectedPlan.revisions,
        features: selectedPlan.features
      },
      requirements,
      amount: selectedPlan.price,
      revisionsLeft: selectedPlan.revisions
    });

    await order.save();

    // Populate references for response
    await order.populate([
      { path: "buyerId", select: "name email profilePic" },
      { path: "sellerId", select: "name email profilePic" },
      { path: "gigId", select: "title category gigThumbnail" }
    ]);

    res.status(201).json({
      msg: "Order created successfully",
      order
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get orders for current user (based on role)
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let query = {};
    
    // Filter by user role
    if (req.user.role === "client") {
      query.buyerId = userId;
    } else {
      query.sellerId = userId;
    }

    // Filter by status if provided
    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate("buyerId", "name email profilePic")
      .populate("sellerId", "name email profilePic")
      .populate("gigId", "title category gigThumbnail")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate("buyerId", "name email profilePic")
      .populate("sellerId", "name email profilePic")
      .populate("gigId", "title category gigThumbnail gigImages");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Check if user has access to this order
    if (order.buyerId._id.toString() !== userId && order.sellerId._id.toString() !== userId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    res.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update order status (freelancer only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryFiles } = req.body;
    const userId = req.user.id;

    if (req.user.role !== "freelancer") {
      return res.status(403).json({ msg: "Only freelancers can update order status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.sellerId.toString() !== userId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Validate status transition
    const validTransitions = {
      "Pending": ["In Progress"],
      "In Progress": ["Delivered"],
      "Delivered": ["Completed"],
      "Completed": [],
      "Cancelled": []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        msg: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    // Update order
    const updateData = { status };
    if (deliveryFiles && status === "Delivered") {
      updateData.deliveryFiles = deliveryFiles;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate([
      { path: "buyerId", select: "name email profilePic" },
      { path: "sellerId", select: "name email profilePic" },
      { path: "gigId", select: "title category gigThumbnail" }
    ]);

    res.json({
      msg: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Request revision (client only)
const requestRevision = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { revisionNotes } = req.body;
    const userId = req.user.id;

    if (req.user.role !== "client") {
      return res.status(403).json({ msg: "Only clients can request revisions" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ msg: "Can only request revision for delivered orders" });
    }

    if (order.revisionsLeft <= 0) {
      return res.status(400).json({ msg: "No revisions left" });
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "In Progress",
        revisionsLeft: order.revisionsLeft - 1,
        $push: { revisionNotes: { note: revisionNotes, requestedAt: new Date() } }
      },
      { new: true }
    ).populate([
      { path: "buyerId", select: "name email profilePic" },
      { path: "sellerId", select: "name email profilePic" },
      { path: "gigId", select: "title category gigThumbnail" }
    ]);

    res.json({
      msg: "Revision requested successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Request revision error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Complete order (client only)
const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (req.user.role !== "client") {
      return res.status(403).json({ msg: "Only clients can complete orders" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ msg: "Can only complete delivered orders" });
    }

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "Completed" },
      { new: true }
    ).populate([
      { path: "buyerId", select: "name email profilePic" },
      { path: "sellerId", select: "name email profilePic" },
      { path: "gigId", select: "title category gigThumbnail" }
    ]);

    res.json({
      msg: "Order completed successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Complete order error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Only buyer or seller can cancel
    if (order.buyerId.toString() !== userId && order.sellerId.toString() !== userId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Can only cancel pending or in progress orders
    if (!["Pending", "In Progress"].includes(order.status)) {
      return res.status(400).json({ msg: "Cannot cancel this order" });
    }

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "Cancelled" },
      { new: true }
    ).populate([
      { path: "buyerId", select: "name email profilePic" },
      { path: "sellerId", select: "name email profilePic" },
      { path: "gigId", select: "title category gigThumbnail" }
    ]);

    res.json({
      msg: "Order cancelled successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === "client") {
      query.buyerId = userId;
    } else {
      query.sellerId = userId;
    }

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(query);
    const totalAmount = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const formattedStats = {
      totalOrders,
      totalAmount: totalAmount[0]?.total || 0,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, amount: stat.totalAmount };
        return acc;
      }, {})
    };

    res.json({ stats: formattedStats });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  requestRevision,
  completeOrder,
  cancelOrder,
  getOrderStats
};
