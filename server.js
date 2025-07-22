const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConnection");

dotenv.config();
connectDB();

const app = express();
// Allow requests from your frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes for authentication
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
// Routes for gigs
const gigRoutes = require("./routes/gigRoutes");
app.use("/api/gigs", gigRoutes);
// Middleware for file uploads
const upload = require("./middleware/multer");


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
