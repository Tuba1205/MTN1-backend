const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    
    day: { type: String, required: true }, // e.g., 'Monday'
    date: { type: String, required: true },
    startTime: { type: String, required: true }, // e.g., '09:00'
    endTime: { type: String, required: true }, // e.g., '09:40'

    rescheduledTime: Date,
    cancellationTime: Date,

    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
        default: 'pending' 
    }
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

module.exports = Booking;
