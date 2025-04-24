const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Assuming you're using the User model
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Booking = require('../models/Booking');
const Student = require('../models/Student');


// Create admin user
const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        let existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new admin
        const newAdmin = new User({
            name,
            email,
            password: hashedPassword,
            role: 'admin',
            zoomAccessToken: null,  // Default value for zoomAccessToken (if not needed)
        });

        await newAdmin.save();

        const token = jwt.sign(
          { id: newAdmin._id, role: 'admin' }, // Change `userId` to `id`
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
      );
      

        res.status(201).json({ message: 'Admin created successfully', token });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// In adminController.js
const addTimeSlot = async (req, res) => {
  const { teacherId, day } = req.body;
  try {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
          return res.status(404).json({ message: 'Teacher not found' });
      }

      // Define fixed slots
      const fixedSlots = [
          { startTime: "09:00", endTime: "09:40" },
          { startTime: "10:00", endTime: "10:40" },
          { startTime: "11:00", endTime: "11:40" },
          { startTime: "12:00", endTime: "12:40" },
          { startTime: "14:00", endTime: "14:40" },
      ];

      // Ensure teacher does not already have slots for the day
      if (teacher.availableSlots.some(slot => slot.day === day)) {
          return res.status(400).json({ message: 'Slots for this day are already set' });
      }

      // Assign fixed slots to the teacher for the given day
      teacher.availableSlots.push(...fixedSlots.map(slot => ({ day, ...slot })));
      await teacher.save();

      res.status(201).json({ message: 'Time slots added successfully', teacher });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error adding time slot' });
  }
};

// Function to check if a slot is booked and disable it
const getTeacherAvailableSlots = async (req, res) => {
  const { teacherId, day } = req.params;

  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Ensure day comparison is case-insensitive
    let normalizedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

    // Get bookings for the selected day
    const bookings = await Booking.find({ teacherId, day: normalizedDay });

    // Filter teacher's available slots for the selected day
    let availableSlots = teacher.availableSlots.filter(slot => slot.day === normalizedDay);

    // If no slots exist, return the predefined ones
    if (availableSlots.length === 0) {
      availableSlots = [
        { startTime: "09:00", endTime: "09:40", day: normalizedDay, isBooked: false },
        { startTime: "10:00", endTime: "10:40", day: normalizedDay, isBooked: false },
        { startTime: "11:00", endTime: "11:40", day: normalizedDay, isBooked: false },
        { startTime: "12:00", endTime: "12:40", day: normalizedDay, isBooked: false },
        { startTime: "14:00", endTime: "14:40", day: normalizedDay, isBooked: false },
      ];
    }

    // Mark slots as booked if they exist in `bookings`
    availableSlots = availableSlots.map(slot => ({
      ...slot,
      isBooked: bookings.some(booking => booking.startTime === slot.startTime),
    }));

    res.status(200).json({ availableSlots });
  } catch (error) {
    res.status(500).json({ message: "Error fetching available slots" });
  }
};

//get all teachers
const getAllTeachers = async (req, res) => {
  try {
      const teachers = await Teacher.find({}, "_id name");
      res.status(200).json(teachers);
  } catch (error) {
      res.status(500).json({ message: "Error fetching teachers" });
  }
};

// get all students 
const getAllStudents = async (req, res) => { 
  try {
      const students = await Student.find({}, "_id name"); 
      res.status(200).json(students); // Corrected variable name
  } catch (error) {
      res.status(500).json({ message: "Error fetching students", error: error.message }); 
  }
};

// Function to assign slots to a teacher
const assignTeacherSlots = async (req, res) => {
  try {
    const { teacherId, day, slots } = req.body;

    if (!teacherId || !day || !Array.isArray(slots)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Find existing slots for the same day
    let existingSlots = teacher.availableSlots.filter(slot => slot.day === day);

    // Validate new slots and filter out invalid entries
    const newSlots = slots
      .filter(slot => slot.startTime && slot.endTime) // Ensure startTime & endTime exist
      .map(slot => ({
        day, // Ensure day is always assigned
        startTime: slot.startTime,
        endTime: slot.endTime
      }));

    if (newSlots.length === 0) {
      return res.status(400).json({ message: "No valid slots to add" });
    }

    // Merge existing slots with new slots
    teacher.availableSlots = [
      ...teacher.availableSlots.filter(slot => slot.day !== day), // Keep other days' slots
      ...existingSlots,
      ...newSlots
    ];

    await teacher.save();

    res.status(201).json({ message: "Slots assigned successfully", teacher });
  } catch (error) {
    console.error("Error assigning slots:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Function to delete a specific slot
const deleteTeacherSlot = async (req, res) => {
  try {
      const { teacherId, day, startTime } = req.body;

      if (!teacherId || !day || !startTime) {
          return res.status(400).json({ message: "❌ Missing required fields: teacherId, day, or startTime." });
      }

      // ✅ Find the teacher
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
          return res.status(404).json({ message: "❌ Teacher not found." });
      }

      // ✅ Filter out the slot that needs to be deleted
      teacher.availableSlots = teacher.availableSlots.filter(
          slot => !(slot.day === day && slot.startTime === startTime)
      );

      // ✅ Save updated teacher document
      await teacher.save();

      return res.status(200).json({ message: "✅ Slot deleted successfully!" });
  } catch (error) {
      console.error("❌ Error deleting slot:", error);
      return res.status(500).json({ message: "❌ Internal Server Error" });
  }
};


module.exports = { createAdmin, addTimeSlot, getTeacherAvailableSlots, getAllTeachers, assignTeacherSlots, deleteTeacherSlot, getAllStudents };  
