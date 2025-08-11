const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const {
  sendMessage,
  getConversation,
  getMyConversations,
  markAsRead,
  deleteMessage
} = require("../controllers/messageController");

// All routes require authentication
router.use(verifyToken);

// Send a message
router.post("/", sendMessage);

// Get all conversations for current user
router.get("/conversations", getMyConversations);

// Get conversation for a specific order
router.get("/conversation/:orderId", getConversation);

// Mark messages as read
router.patch("/mark-read", markAsRead);

// Delete a message (only sender can delete)
router.delete("/:messageId", deleteMessage);

module.exports = router; 