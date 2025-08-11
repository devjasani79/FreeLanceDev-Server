const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const allowRoles = require("../middleware/allowRoles");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  requestRevision,
  completeOrder,
  cancelOrder,
  getOrderStats
} = require("../controllers/orderController");

// All routes require authentication
router.use(verifyToken);

// Create new order (clients only)
router.post("/", allowRoles(["client"]), createOrder);

// Get orders for current user
router.get("/my-orders", getMyOrders);

// Get order statistics
router.get("/stats", getOrderStats);

// Get single order by ID
router.get("/:orderId", getOrderById);

// Update order status (freelancers only)
router.patch("/:orderId/status", allowRoles(["freelancer"]), updateOrderStatus);

// Request revision (clients only)
router.post("/:orderId/revision", allowRoles(["client"]), requestRevision);

// Complete order (clients only)
router.patch("/:orderId/complete", allowRoles(["client"]), completeOrder);

// Cancel order (both clients and freelancers)
router.patch("/:orderId/cancel", cancelOrder);

module.exports = router;
