const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
    email: { type: String, required: true },  // Store OTP with email
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } // OTP expires in 5 minutes
});

module.exports = mongoose.model("OTP", OTPSchema);
