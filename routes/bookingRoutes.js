const express = require('express'); 
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { 
    createBooking, 
    rescheduleBooking, 
    cancelBooking, 
    getAvailableSlots, 
    addAvailableSlot,
    deleteBooking 
} = require('../controllers/bookingController.js');


const router = express.Router();

// Booking Routes
router.get("/", authMiddleware, async (req, res) => {
    try {
        console.log("🔍 Request from User:", req.user); // Debugging

        const userId = req.user.id; // Get logged-in user's ID
        const role = req.user.role; // Get the user's role (student or admin)

        let bookings;

        if (role === "student") {
            // If user is a student, show only their bookings
            bookings = await Booking.find({ student: userId }) // Filter by student ID
                .populate("student", "name email")
                .populate("teacher", "name email");
        } else if (role === "admin") {
            // If user is an admin, show all bookings
            bookings = await Booking.find() // No filtering by student ID
                .populate("student", "name email")
                .populate("teacher", "name email");
        } else {
            return res.status(403).json({ message: "Unauthorized: Invalid role" });
        }

        console.log("📋 Bookings:", bookings);
        res.json(bookings);
    } catch (error) {
        console.error("❌ Error fetching bookings:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.post('/create', authMiddleware, roleMiddleware('student'), createBooking);


router.put('/:bookingId/reschedule', authMiddleware, roleMiddleware('teacher', 'admin'), rescheduleBooking);
router.delete('/:bookingId/cancel', authMiddleware, roleMiddleware('teacher', 'admin'), cancelBooking);
router.delete('/:bookingId/delete', authMiddleware, roleMiddleware('admin'), deleteBooking);

// Fetch available slots for a specific teacher and day
router.get("/availableSlots/:teacherId/:day", getAvailableSlots);

// Admin adds available slots for teachers
router.post("/availableSlots", addAvailableSlot);

module.exports = router;
