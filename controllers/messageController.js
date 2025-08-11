const Message = require("../models/Message");
const Order = require("../models/Order");

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { orderId, receiverId, content, messageType = "text", fileUrl } = req.body;
    const senderId = req.user.id;

    // Validate order exists and user has access
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Check if user is part of this order
    if (order.buyerId.toString() !== senderId && order.sellerId.toString() !== senderId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Check if receiver is part of this order
    if (order.buyerId.toString() !== receiverId && order.sellerId.toString() !== receiverId) {
      return res.status(403).json({ msg: "Invalid receiver" });
    }

    // Create message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      orderId,
      content,
      messageType,
      fileUrl
    });

    await message.save();

    // Populate sender and receiver info
    await message.populate([
      { path: "sender", select: "name email profilePic" },
      { path: "receiver", select: "name email profilePic" }
    ]);

    res.status(201).json({
      msg: "Message sent successfully",
      message
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get conversation for an order
const getConversation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Validate order exists and user has access
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.buyerId.toString() !== userId && order.sellerId.toString() !== userId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const skip = (page - 1) * limit;

    // Get messages for this order
    const messages = await Message.find({ orderId })
      .populate("sender", "name email profilePic")
      .populate("receiver", "name email profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ orderId });

    // Mark messages as read if receiver is current user
    const unreadMessages = messages.filter(
      msg => msg.receiver._id.toString() === userId && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { isRead: true, readAt: new Date() }
      );
    }

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get all conversations for current user
const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Get orders where user is buyer or seller
    const orders = await Order.find({
      $or: [{ buyerId: userId }, { sellerId: userId }]
    }).select("_id gigId buyerId sellerId status");

    const orderIds = orders.map(order => order._id);

    // Get latest message for each order
    const conversations = await Message.aggregate([
      { $match: { orderId: { $in: orderIds } } },
      {
        $group: {
          _id: "$orderId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiver", userId] }, { $eq: ["$isRead", false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { "lastMessage.createdAt": -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Populate order and user details
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const order = orders.find(o => o._id.toString() === conv._id.toString());
        const lastMessage = await Message.findById(conv.lastMessage._id)
          .populate("sender", "name email profilePic")
          .populate("receiver", "name email profilePic");

        return {
          orderId: conv._id,
          order,
          lastMessage,
          unreadCount: conv.unreadCount
        };
      })
    );

    const total = conversations.length;

    res.json({
      conversations: populatedConversations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalConversations: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ msg: "Invalid message IDs" });
    }

    // Update messages where current user is receiver
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      msg: "Messages marked as read",
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete message (only sender can delete)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ msg: "Can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ msg: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getMyConversations,
  markAsRead,
  deleteMessage
}; 