const mongoose = require('mongoose');

// Define the class booking schema
const classBookingSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,  // Ensure a teacher is linked to this booking
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,  // Ensure a student is linked to this booking
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'canceled'],
    default: 'pending',
  },
});

// Create the ClassBooking model using the schema
const ClassBooking = mongoose.model('ClassBooking', classBookingSchema);

module.exports = ClassBooking;
