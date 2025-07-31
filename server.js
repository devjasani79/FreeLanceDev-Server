// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler"); // Adjust path as needed

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "https://freelancedev.vercel.app"], // array of allowed origins
  methods: "GET,POST,PUT,DELETE",  // comma-separated string is fine
  credentials: true, // enable cookies, auth headers, TLS client certs
}));

// Parse JSON request bodies
app.use(express.json());

// --- Import routes ---
const authRoutes = require("./routes/auth");
const gigRoutes = require("./routes/gigRoutes");
// const orderRoutes = require("./routes/orderRoutes");

// --- Use routes ---
app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigRoutes);
// app.use("/api/orders", orderRoutes);  

// Error handling middleware: MUST be after all routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
