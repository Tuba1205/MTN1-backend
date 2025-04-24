const express = require('express');
const { scheduleClassWithZoom } = require('../controllers/classBookingController');

const router = express.Router();

// Route for booking a class and scheduling the Zoom meeting
router.post('/schedule-class', scheduleClassWithZoom);

module.exports = router;
