const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { createStudent, getAllStudents } = require('../controllers/StudentController');
const Student = require('../models/Student');
const router = express.Router();

// Create a new student
router.post('/create', createStudent);

// Fetch all students (Admin Only)
router.get('/all', authMiddleware, roleMiddleware('admin'), getAllStudents);


// Get student profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        console.log("🔍 Requesting Profile for User ID:", req.user.id);

        if (!req.user.id) {
            return res.status(401).json({ message: 'Unauthorized: No user ID in token' });
        }

        const student = await Student.findById(req.user.id);
        console.log("🎯 Fetched Student:", student);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json(student);
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});



// Update student profile
router.put('/profile', authMiddleware, roleMiddleware('student'), async (req, res) => {
    try {
        const userId = req.user.id; // Fix user ID extraction

        const updatedStudent = await Student.findByIdAndUpdate(
            userId, // Use `id` instead of `userId`
            req.body,
            { new: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json(updatedStudent);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: 'Error updating profile', error });
    }
});


module.exports = router;
