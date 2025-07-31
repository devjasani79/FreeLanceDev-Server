// dbConnection.js
const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${connect.connection.host}`);
    console.log(`Database Connected Successfully`);
  } catch (err) {
    console.error("Error Connecting to Database ", err);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDb;
