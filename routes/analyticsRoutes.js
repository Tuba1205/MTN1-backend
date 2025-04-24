const express = require("express");
const router = express.Router();
const { getTotalBookings, getTotalCancellationsAndNoShows } = require("../controllers/analyticsController");

// ✅ Total bookings per teacher/student
router.get("/bookings/total/:userId/:role", getTotalBookings);

// ✅ Cancellations and no-shows
router.get("/bookings/cancellations/:userId/:role", getTotalCancellationsAndNoShows);

module.exports = router;
