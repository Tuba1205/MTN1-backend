const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const Booking = require('../models/Booking');
const { createAdmin, addTimeSlot, getTeacherAvailableSlots, getAllTeachers, assignTeacherSlots, deleteTeacherSlot, getAllStudents } = require('../controllers/adminController');  // Correct import of the controller
const { sendBookingConfirmation } = require('../controllers/notificationController.js');
const router = express.Router();
const {createStudentByAdmin} = require('../controllers/StudentController');
const {createTeacherByAdmin} = require('../controllers/teacherController');

const Student = require("../models/Student"); // Adjust path as needed
const Teacher = require("../models/Teacher");

// admin dashboard to look cool
router.get("/dashboard-stats", async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalBookings = await Booking.countDocuments();

    res.json({ totalStudents, totalTeachers, totalBookings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Route to create admin user
router.post('/create-admin', createAdmin);

// Route to get all teachers
router.get("/teachers", getAllTeachers);

// Route to get all students
router.get("/students", getAllStudents);


// Admin creates a student
router.post('/create-student', authMiddleware, roleMiddleware('admin'), createStudentByAdmin);

// Admin creates a teacher
router.post('/create-teacher', authMiddleware, roleMiddleware('admin'), createTeacherByAdmin);

// create slots for teacher
router.post("/assignslot", authMiddleware, roleMiddleware(["admin"]), assignTeacherSlots);

// delete slot for teacher
router.delete("/deleteslot", authMiddleware, roleMiddleware(["admin"]), deleteTeacherSlot);
// Get all bookings for the admin
router.get('/all-bookings', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const bookings = await Booking.find();  // Fetch all bookings
        res.status(200).json({ bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching bookings' });
    }
});

// Assign a class to a student and teacher (admin only)
router.post('/assign-class', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { studentId, teacherId, day, date, startTime } = req.body;

        // Step 1: Validate the incoming request data
        if (!studentId || !teacherId || !day || !date || !startTime) {
            return res.status(400).json({ message: "All fields must be provided." });
        }

        // Step 2: Find the teacher
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // Step 3: Convert the date string to a Date object and get the day of the week
        const selectedDate = new Date(date);
        const selectedDay = selectedDate.toLocaleString('en-US', { weekday: 'long' });

        // Ensure the day of the week matches
        if (selectedDay !== day) {
            return res.status(400).json({ message: `Selected day does not match the date's day of the week. Expected ${selectedDay}, got ${day}` });
        }

        // Step 4: Get the teacher's available slots for the selected day
        let availableSlots = teacher.availableSlots.filter(slot => slot.day === day);

        // If teacher has no slots, return predefined slots
        if (availableSlots.length === 0) {
            availableSlots = [
                { startTime: "09:00", endTime: "09:40", day, isBooked: false },
                { startTime: "10:00", endTime: "10:40", day, isBooked: false },
                { startTime: "11:00", endTime: "11:40", day, isBooked: false },
                { startTime: "12:00", endTime: "12:40", day, isBooked: false },
                { startTime: "14:00", endTime: "14:40", day, isBooked: false },
            ];
        }

        // Step 5: Find the slot with the matching startTime
        const selectedSlot = availableSlots.find(slot => slot.startTime === startTime && !slot.isBooked);
        if (!selectedSlot) {
            return res.status(400).json({ message: "Selected time slot is not available" });
        }

        // Extract endTime from the selected slot
        const { endTime } = selectedSlot;

        // Step 6: Check if the slot is already booked
        const existingBooking = await Booking.findOne({ teacher: teacherId, startTime, day, date });
        if (existingBooking) {
            return res.status(400).json({ message: "This slot is already booked" });
        }

        // Step 7: Assign the class with startTime & endTime
        const booking = new Booking({
            student: studentId,
            teacher: teacherId,
            startTime,
            endTime,
            day,
            date
        });

        await booking.save();

        // Step 8: Update the teacher's slot to mark it as booked
        teacher.availableSlots = teacher.availableSlots.map(slot =>
            slot.startTime === startTime && slot.day === day ? { ...slot, isBooked: true } : slot
        );

        await teacher.save();

        // Step 9: Send confirmation (optional email or notification)
        await sendBookingConfirmation(booking);

        res.status(200).json({
            message: "Class assigned successfully",
            classDetails: booking,
        });
    } catch (error) {
        console.error("Error assigning class:", error);
        res.status(500).json({ message: "Error assigning class" });
    }
});


// Route to update the status of a class booking (admin only)
router.put('/update-class-status', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { bookingId, status } = req.body;

        // Ensure status is a valid value (e.g., pending, confirmed, completed, etc.)
        const validStatuses = ['pending', 'confirmed', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find the class booking by ID and update its status
        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            { status },
            { new: true } // Return the updated booking
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Send the updated booking details in the response
        res.status(200).json({
            message: 'Class status updated successfully',
            updatedBooking: booking,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating class status' });
    }
});

// route to add a time slot
router.post('/assignTeacherSlots', addTimeSlot);

// set booking restrictions route
router.get('/getTeacherAvailableSlots/:teacherId/:day', getTeacherAvailableSlots);




module.exports = router;
