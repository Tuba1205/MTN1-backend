const Booking = require("../models/Booking");
const mongoose = require("mongoose");

// ✅ Get total bookings per teacher/student
const getTotalBookings = async (req, res) => {
  try {
      let { userId, role } = req.params;
      console.log("Received ID:", userId);

      // Convert userId to ObjectId (before validation)
      const objectId = new mongoose.Types.ObjectId(userId);

      // Validate if userId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(objectId)) {
          return res.status(400).json({ message: "Invalid ID format" });
      }

      // If valid, query with ObjectId directly
      let filter = role === "teacher" ? { teacher: objectId } : { student: objectId };
      const totalBookings = await Booking.countDocuments(filter);

      res.json({ totalBookings });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get cancellations and no-shows
const getTotalCancellationsAndNoShows = async (req, res) => {
  try {
      let { userId, role } = req.params;
      
      // Trim any spaces from the ID and log the received userId
      userId = userId.trim();
      console.log("Received ID:", userId);

      // Convert to ObjectId (before validation)
      const objectId = new mongoose.Types.ObjectId(userId);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(objectId)) {
          return res.status(400).json({ message: "Invalid ID format" });
      }

      // Filter based on role
      let filter = role === "teacher" ? { teacher: objectId } : { student: objectId };

      // Count cancellations
      const totalCancellations = await Booking.countDocuments({
          ...filter,
          status: "cancelled",
      });

      // Count no-shows
      const totalNoShows = await Booking.countDocuments({
          ...filter,
          status: "confirmed",
          rescheduledTime: null,
          cancellationTime: null,
      });

      res.json({ totalCancellations, totalNoShows });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getTotalBookings, getTotalCancellationsAndNoShows };
