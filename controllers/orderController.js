const Order = require('../models/Order');
const Gig = require('../models/Gigs'); // Model, fix if your filename differs
const User = require('../models/User');

/**
 * CREATE ORDER (simulate payment for now)
 * Expects: { gigId, plan (object), buyerId, sellerId, amount, requirements }
 */
const createOrder = async (req, res, next) => {
  try {
    const { gigId, plan, buyerId, sellerId, amount, requirements } = req.body;

    // Validation
    if (!gigId || !plan || !buyerId || !sellerId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Gig existence check
    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });

    // (Later: validate plan within gig.pricePlans)
    // (Later: validate roles match!)

    const order = new Order({
      gigId,
      buyerId,
      sellerId,
      plan,
      amount,
      requirements: requirements || "",
      status: 'In Progress', // Simulate payment success
      paymentStatus: 'Paid', // For future Stripe
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    next(err); // Pass to errorHandler middleware
  }
};

/**
 * GET all orders for logged-in user (buyer or seller)
 */
const getOrdersForUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const filter = (role === 'client')
      ? { buyerId: userId }
      : (role === 'freelancer')
        ? { sellerId: userId }
        : null;

    if (!filter) return res.status(403).json({ message: 'Access denied' });

    const orders = await Order.find(filter)
      .populate('gigId')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    next(err);
  }
};

/**
 * GET a single order by ID
 */
const getOrderById = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate('gigId')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only buyer, seller, or admin can fetch
    if (
      order.buyerId._id.toString() !== req.user._id.toString() &&
      order.sellerId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE order status (only seller or admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const allowedStatus = ['Pending', 'In Progress', 'Delivered', 'Completed', 'Cancelled'];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (
      order.sellerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * DELIVER work (seller uploads files, marks as 'Delivered')
 * Expects file upload on req.files
 */
const deliverOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (
      order.sellerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Accept upload (Cloudinary or similar, via multer)
    const deliveryFiles = req.files?.map(file => file.path) || []; // Adjust for your upload structure

    order.deliveryFiles = (order.deliveryFiles || []).concat(deliveryFiles);
    order.status = 'Delivered';
    order.updatedAt = Date.now();
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * REQUEST revision (client)
 */
const requestRevision = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyer can request revision' });
    }

    if (order.revisionsLeft <= 0) {
      return res.status(400).json({ message: "No revisions left" });
    }

    order.revisionsLeft -= 1;
    order.status = "In Progress";
    order.updatedAt = Date.now();
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// CANCEL order (buyer, seller, or admin)
const cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only buyer, seller or admin
    if (
      order.buyerId.toString() !== req.user._id.toString() &&
      order.sellerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    order.status = 'Cancelled';
    order.updatedAt = Date.now();
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * LEAVE REVIEW (client after Completed)
 * Expects: { rating, comment }
 */
const leaveReview = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { rating, comment } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyer can leave review' });
    }
    if (order.status !== 'Completed') {
      return res.status(400).json({ message: 'Order must be Completed to leave review' });
    }

    order.feedback = { rating, comment };
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// ==========================
// EXPORT ALL CONTROLLER FNS
// ==========================
module.exports = {
  createOrder,
  getOrdersForUser,
  getOrderById,
  updateOrderStatus,
  deliverOrder,
  requestRevision,
  cancelOrder,
  leaveReview,
};
