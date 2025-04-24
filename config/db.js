const mongoose = require('mongoose');

// Database connection function
const connectDB = async () => {
    try {
        const MONGO_URI = "mongodb+srv://f8487160:fXiMgpU3jiDzniSP@cluster0.zocsbc2.mongodb.net/MTN-app?retryWrites=true&w=majority&appName=Cluster0";

        // Connect to MongoDB without deprecated options
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
};

// Export the function using CommonJS
module.exports = connectDB;
