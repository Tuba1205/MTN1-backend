const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subject: { type: String, required: true },
  phoneNumber: { type: String, required: true },

  // Fixed available slots assigned by admin
  availableSlots: [{
    day: { type: String, required: true }, // e.g., 'Monday'
    startTime: { type: String, required: true }, // e.g., '09:00'
    endTime: { type: String, required: true } // e.g., '09:40'
  }],

  role: { type: String, default: 'teacher' },
  zoomAccessToken: { type: String, default: null } // Allow it to be null initially
});

module.exports = mongoose.model("Teacher", TeacherSchema);
