// services/cronJob.js
const cron = require('node-cron');
const sendReminderEmail = require('../utilis/emailService'); // Example utility for sending emails

// Define your cron job
const start = () => {
  cron.schedule('0 9 * * *', async () => {
    // This will run every day at 9 AM
    console.log('Sending daily reminders...');

    // Example: Send an email reminder
    try {
      await sendReminderEmail('student@example.com', 'Class Reminder', 'Reminder for your class at 10 AM');
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  });
};

// Export the start function
module.exports = { start };
