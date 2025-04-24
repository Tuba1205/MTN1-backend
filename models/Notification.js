const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String,
     enum: ['Booking Confirmation', 'New Booking', 'Booking Rescheduled', 'Booking Cancellation', 'Reminder', 'Conflict', 'New Message'],
     required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
