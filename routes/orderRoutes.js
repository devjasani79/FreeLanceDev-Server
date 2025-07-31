const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrdersForUser,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const verifyToken = require('../middleware/verifyToken');
const allowRoles = require('../middleware/allowRoles');

// Protected routes (all routes require authentication)
router.use(verifyToken);

/**
 * POST /orders
 * Create a new order after payment
 * Allowed roles: client (buyer)
 */
router.post('/', allowRoles(['client']), createOrder);

/**
 * GET /orders
 * Get orders for logged in user (buyer or seller)
 * Allowed roles: client, freelancer
 */
router.get('/', allowRoles(['client', 'freelancer']), getOrdersForUser);

/**
 * GET /orders/:id
 * Get specific order details - buyer, seller or admin only
 * Allowed roles: client, freelancer, admin
 */
router.get('/:id', allowRoles(['client', 'freelancer', 'admin']), getOrderById);

/**
 * PATCH /orders/:id/status
 * Update order status - only seller (freelancer) or admin can update
 */
router.patch('/:id/status', allowRoles(['freelancer', 'admin']), updateOrderStatus);

module.exports = router;
