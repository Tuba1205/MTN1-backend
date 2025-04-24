const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher.js");

const createTeacher = async (req, res) => {
    const { name, email, password, subject, phoneNumber } = req.body;

    try {
        if (!name || !email || !password || !subject || !phoneNumber) {
            return res.status(400).json({ error: "Please provide all required fields." });
        }

        // Check if the teacher already exists
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ error: "Teacher already exists with this email." });
        }

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new teacher
        const newTeacher = new Teacher({
            name,
            email,
            password: hashedPassword,  // Save the hashed password
            subject,
            phoneNumber,
        });

        await newTeacher.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newTeacher._id, role: "teacher" },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(201).json({
            message: "Teacher created successfully",
            teacherId: newTeacher._id,
            token,  // Send back the token
        });
    } catch (error) {
        console.error("Error creating teacher:", error);
        return res.status(500).json({ error: "Failed to create teacher" });
    }
};

// Function for Admin to create a teacher
const createTeacherByAdmin = async (req, res) => {
    const { name, email, password, subject, phoneNumber } = req.body;
  
    try {
      if (!name || !email || !password || !subject || !phoneNumber) {
        return res.status(400).json({ error: "All fields are required." });
      }
  
      // Check if teacher already exists
      const existingTeacher = await Teacher.findOne({ email });
      if (existingTeacher) {
        return res.status(400).json({ error: "Teacher already exists with this email." });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create teacher
      const newTeacher = new Teacher({
        name,
        email,
        password: hashedPassword,
        subject,
        phoneNumber,
        role: "teacher",
      });
  
      await newTeacher.save();
  
      return res.status(201).json({
        message: "Teacher created successfully by Admin",
        teacherId: newTeacher._id,
      });
    } catch (error) {
      console.error("Error creating teacher by Admin:", error);
      return res.status(500).json({ error: "Failed to create teacher" });
    }
  };
  

// Fetch teacher profile
const getTeacherProfile = async (req, res) => {
  try {
      const teacher = await Teacher.findById(req.user.id).select("-password");

      if (!teacher) {
          return res.status(404).json({ message: "Teacher not found" });
      }

      res.json(teacher);
  } catch (error) {
      console.error("Profile Fetch Error:", error);
      res.status(500).json({ message: "Server error", error });
  }
};


const getAvailableSlots = async (req, res) => {
    const teacherId = req.params.teacherId;
    try {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      res.status(200).json(teacher.availableSlots);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching available slots' });
    }
  };
  

module.exports = { createTeacher, getTeacherProfile, getAvailableSlots, createTeacherByAdmin };
