// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
const config = require("./config/environment");

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.io configuration using environment config
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors({
  origin: config.cors.origins,
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// --- Import routes ---
const authRoutes = require("./routes/auth");
const gigRoutes = require("./routes/gigRoutes");
const orderRoutes = require("./routes/orderRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// --- Use routes ---
app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join order room for real-time updates
  socket.on("join-order", (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`User ${socket.id} joined order ${orderId}`);
  });

  // Leave order room
  socket.on("leave-order", (orderId) => {
    socket.leave(`order-${orderId}`);
    console.log(`User ${socket.id} left order ${orderId}`);
  });

  // Handle new message
  socket.on("new-message", (data) => {
    socket.to(`order-${data.orderId}`).emit("message-received", data);
  });

  // Handle order status update
  socket.on("order-status-update", (data) => {
    socket.to(`order-${data.orderId}`).emit("status-updated", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Error handling middleware: MUST be after all routes
app.use(errorHandler);

const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io server ready`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`✅ Allowed origins: ${config.cors.origins.join(', ')}`);
  console.log(`📧 Email notifications: ${config.features.emailNotifications ? 'Enabled' : 'Disabled'}`);
  console.log(`📁 File uploads: ${config.features.fileUploads ? 'Enabled' : 'Disabled'}`);
  console.log(`💬 Real-time chat: ${config.features.realTimeChat ? 'Enabled' : 'Disabled'}`);
});
