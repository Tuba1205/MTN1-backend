const Notification = require('../models/Notification');
const User = require('../models/User'); // Make sure to import the User model
const sendEmail = require('../utilis/emailService.js'); // Email sending utility

// Helper function to send an in-app and email notification
exports.createNotification = async (userId, type, message) => {
  try {
    const notification = new Notification({
      userId,
      type,
      message,
    });
    await notification.save();

    // Send email notification (if required)
    const user = await User.findById(userId);
    if (user) {
      sendEmail(user.email, `${type} Notification`, message);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Send booking confirmation to student and teacher
exports.sendBookingConfirmation = async (booking) => {
  const { student, teacher, startTime } = booking;

  const studentMessage = `Your class with teacher ${teacher.name} has been successfully booked for ${startTime}.`;
  const teacherMessage = `You have a new class booked with student ${student.name} for ${startTime}.`;

  await this.createNotification(student._id, 'Booking Confirmation', studentMessage);
  await this.createNotification(teacher._id, 'Booking Confirmation', teacherMessage);
};

// Send booking cancellation notification to student and teacher
exports.sendBookingCancellation = async (booking) => {
  const { student, teacher, startTime } = booking;

  const studentMessage = `Your class with teacher ${teacher.name} scheduled for ${startTime} has been cancelled.`;
  const teacherMessage = `Your class with student ${student.name} scheduled for ${startTime} has been cancelled.`;

  await this.createNotification(student._id, 'Booking Cancellation', studentMessage);
  await this.createNotification(teacher._id, 'Booking Cancellation', teacherMessage);
};

// Send booking reschedule notification to student and teacher
exports.sendBookingReschedule = async (booking, newStartTime) => {
  const { student, teacher, startTime } = booking;

  const studentMessage = `Your class with teacher ${teacher.name} has been rescheduled to ${newStartTime}.`;
  const teacherMessage = `Your class with student ${student.name} has been rescheduled to ${newStartTime}.`;

  await this.createNotification(student._id, 'Booking Rescheduled', studentMessage);
  await this.createNotification(teacher._id, 'Booking Rescheduled', teacherMessage);
};

// Send class reminder to student and teacher 24 hours before class
exports.sendClassReminder = async (booking) => {
  const { student, teacher, startTime } = booking;
  const reminderTime = new Date(startTime).getTime() - 24 * 60 * 60 * 1000;  // 24 hours before

  const reminderMessage = `Reminder: Your class with ${teacher.name} is coming up tomorrow at ${startTime}.`;

  // Schedule the reminder for 24 hours before the class starts
  setTimeout(async () => {
    await this.createNotification(student._id, 'Class Reminder', reminderMessage);
    await this.createNotification(teacher._id, 'Class Reminder', reminderMessage);
  }, reminderTime - Date.now());
};

// Send missed class follow-up notification to student
exports.sendMissedClassFollowUp = async (student, teacher, missedClassTime) => {
  const message = `You missed your class with ${teacher.name} scheduled at ${missedClassTime}. Please reschedule as soon as possible.`;

  await this.createNotification(student._id, 'Missed Class Follow-up', message);
};
