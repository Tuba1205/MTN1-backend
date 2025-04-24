const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utilis/emailService.js');
const { oauthCallback } = require('../controllers/authController.js');
const Student = require('../models/Student.js');
const Teacher = require('../models/Teacher.js');
const { getTokens } = require('../utilis/googleAuth');
const OTP = require('../models/Otp.js');
const router = express.Router();

// ✅ Generate and Send OTP Route
router.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Generate a 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to the database (delete old OTPs first)
        await OTP.deleteMany({ email }); // Ensure only one OTP per email
        const newOtp = new OTP({ email, otp: otpCode });
        await newOtp.save();

        console.log("OTP Saved in DB:", newOtp);

        // Send OTP via email
        const subject = "Your OTP Code";
        const text = `Your OTP code is: ${otpCode}. It will expire in 5 minutes.`;
        await sendEmail(email, subject, text);

        res.json({ success: true, message: "OTP Sent Successfully" });

    } catch (error) {
        console.error("Error in sending OTP:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ✅ Verify OTP Route
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        // Log the email and OTP received
        console.log(`Verifying OTP for email: ${email}, OTP: ${otp}`);

        // Find the OTP record
        const otpRecord = await OTP.findOne({ email, otp: String(otp) });

        // Log if OTP record was found
        if (!otpRecord) {
            console.log("No OTP record found or OTP expired");
            return res.status(400).json({ success: false, message: "Invalid or Expired OTP" });
        }

        // Log successful OTP record found
        console.log("OTP verified successfully");

        // Delete OTP after verification (one-time use)
        await OTP.deleteOne({ email, otp: String(otp) });

        res.json({ success: true, message: "OTP Verified Successfully" });

    } catch (error) {
        console.error("Error in OTP verification:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});


// Callback route to handle the OAuth response
router.get('/zoom/callback', oauthCallback);

router.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('Authorization code is required');
    }

    try {
        const tokens = await getTokens(code);
        res.json(tokens);
    } catch (error) {
        res.status(500).send('Failed to exchange authorization code for tokens');
    }
});

// Register a user
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();

        const subject = 'Welcome to MyTutorNetwork!';
        const text = `Hi ${name},\n\nWelcome to MyTutorNetwork! We're excited to have you with us.`;
        await sendEmail(email, subject, text);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login a user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await Student.findOne({ email });
        let role = 'student';

        if (!user) {
            user = await Teacher.findOne({ email });
            role = 'teacher';
        }

        if (!user) {
            user = await User.findOne({ email, role: 'admin' });
            role = 'admin';
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // ✅ Role ko explicitly return karna zaroori hai
        res.status(200).json({ 
            token, 
            role,  // ✅ Add role here
            userId: user._id // ✅ Useful for frontend
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
