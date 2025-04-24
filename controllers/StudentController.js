const Student = require('../models/Student');  // Assuming you have a Student model
const bcrypt = require('bcrypt');

// Controller to handle creating a student
const createStudent = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student already exists with this email.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new student with role
    const newStudent = new Student({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: "student", // Ensure role is explicitly set
    });

    await newStudent.save();

    return res.status(201).json({
      message: 'Student created successfully',
      studentId: newStudent._id,
      role: newStudent.role, // Include role in response
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return res.status(500).json({ error: 'Failed to create student' });
  }
};

// create Student by admin
const createStudentByAdmin = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student already exists with this email.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const newStudent = new Student({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: "student",
    });

    await newStudent.save();

    return res.status(201).json({
      message: 'Student created successfully by Admin',
      studentId: newStudent._id,
    });
  } catch (error) {
    console.error('Error creating student by Admin:', error);
    return res.status(500).json({ error: 'Failed to create student' });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({}, '-password'); // Exclude password field
    return res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
};

module.exports = { createStudent, getAllStudents, createStudentByAdmin };
