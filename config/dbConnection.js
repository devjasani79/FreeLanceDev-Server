            const mongoose = require("mongoose");

            const connectDb = async () => {
                try {
                    const connect = await mongoose.connect(process.env.MONGO_URI);
                    console.log(`Database Connected Succesfully`);
                } catch (err) {
                    console.error("Error Connecting to Database ", err);
                    process.exit(1); // Exit the process with failure
                }
            };


            module.exports = connectDb;
            // This code connects to a MongoDB database using Mongoose.