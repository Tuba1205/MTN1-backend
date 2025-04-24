const express = require("express");
const { createTeacher, getTeacherProfile, getAvailableSlots } = require("../controllers/teacherController.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const roleMiddleware = require("../middleware/roleMiddleware.js");
const Teacher = require("../models/Teacher.js");
const Booking = require("../models/Booking.js");

const router = express.Router();

router.post("/create", createTeacher);  
router.get("/profile", authMiddleware, roleMiddleware("teacher"), getTeacherProfile); 

// Update teacher profile
router.put('/profile', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
    try {
        // Debugging - Ensure the correct user ID is received
        console.log("📌 Decoded User ID from Token:", req.user.id);
        console.log("📌 Incoming Update Request Data:", req.body);

        // Validate if teacher exists before updating
        const teacher = await Teacher.findById(req.user.id);
        if (!teacher) {
            console.log("❌ Teacher not found in DB!");
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Only allow certain fields to be updated (prevent modifying _id, email, etc.)
        const allowedUpdates = ['name', 'subject', 'bio']; // Define fields allowed for update
        const updates = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        // Update the teacher's profile
        const updatedTeacher = await Teacher.findByIdAndUpdate(req.user.id, updates, { new: true });

        // Return updated profile
        console.log("✅ Profile Updated Successfully:", updatedTeacher);
        res.status(200).json(updatedTeacher);
    } catch (error) {
        console.error("🚨 Error updating teacher profile:", error);
        res.status(500).json({ message: 'Error updating teacher profile', error: error.message });
    }
});


// teacher checking theri specific bookings
router.get("/my-bookings",authMiddleware, roleMiddleware("teacher"), // ✅ Only allow teachers
    async (req, res) => {
        try {
            console.log("✅ Teacher is authorized. Fetching bookings...");
            
            const teacherId = req.user.id; // ✅ Extract teacher ID from token
            console.log("📢 Fetching bookings for Teacher ID:", teacherId);

            // ✅ Fetch bookings assigned to the teacher
            const bookings = await Booking.find({ teacher: teacherId })
                .populate("student", "name email")
                .sort({ startTime: 1 });

            console.log("📢 Found Bookings:", bookings);
            res.json(bookings);
        } catch (error) {
            console.error("❌ Error fetching teacher bookings:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// available slots
router.get('/teacher/:teacherId/available-slots', getAvailableSlots);

// Get all teachers
router.get('/all', async (req, res) => {
    try {
        const teachers = await Teacher.find().select("name subject email phoneNumber");
        res.status(200).json(teachers);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        res.status(500).json({ message: "Failed to fetch teachers" });
    }
});




module.exports = router;
