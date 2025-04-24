const Booking = require('../models/Booking');
const moment = require('moment');
const { createNotification } = require('../controllers/notificationController'); // Import notification function
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const User = require('../models/User');

// Create a booking
const createBooking = async (req, res) => {
    try {
        console.log("🔍 Full Request Body:", req.body); // ✅ Debug request body
        const { teacherId, selectedSlotId, studentId, selectedDate } = req.body;

        if (!teacherId || !selectedSlotId || !selectedDate || !studentId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // ✅ Fetch Teacher Data
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // ✅ Find Selected Slot
        const selectedSlot = teacher.availableSlots.id(selectedSlotId);
        if (!selectedSlot || selectedSlot.isBooked) {
            return res.status(400).json({ message: "Selected slot is not available" });
        }

        console.log("✅ Selected Slot Data:", selectedSlot); // ✅ Debug slot data

        // ✅ Ensure Required Fields Exist
        if (!selectedSlot.startTime || !selectedSlot.endTime || !selectedSlot.day) {
            return res.status(400).json({ message: "Slot data is incomplete" });
        }

        // ✅ Convert selectedDate to day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const selectedDayOfWeek = new Date(selectedDate).getDay(); // Get the numeric day (0-6)

        // ✅ Map the slot's `day` (e.g., "Monday") to a corresponding numeric value (0-6)
        const dayMap = {
            "Sunday": 0,
            "Monday": 1,
            "Tuesday": 2,
            "Wednesday": 3,
            "Thursday": 4,
            "Friday": 5,
            "Saturday": 6
        };

        const slotDayOfWeek = dayMap[selectedSlot.day];

        if (selectedDayOfWeek !== slotDayOfWeek) {
            return res.status(400).json({ message: "Selected date does not match the available slot day" });
        }

        // ✅ Create Booking
        const newBooking = new Booking({
            student: req.user.role === "student" ? req.user.id : studentId, // Use studentId passed from request
            teacher: teacherId,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            day: selectedSlot.day,
            date: selectedDate, // Store the selected date
            bookedByRole: req.user.role,
        });

        // ✅ Save Booking & Update Slot
        selectedSlot.isBooked = true;
        await teacher.save();
        const savedBooking = await newBooking.save();

        res.status(201).json(savedBooking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating booking" });
    }
};

// 📅 Helper to format full date
const formatDate = (combinedDateTime) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
    return combinedDateTime.toLocaleDateString('en-US', options); // "Apr 21, 2025"
};

// 📆 Helper to get the weekday (e.g., "Monday")
const formatDay = (combinedDateTime) => {
    const options = { weekday: 'long', timeZone: 'UTC' };
    return combinedDateTime.toLocaleDateString('en-US', options); // "Monday"
};

const rescheduleBooking = async (req, res) => {
    console.log("🔍 User Role in Controller:", req.user.role);

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access Denied: You cannot reschedule this booking" });
    }

    const { bookingId } = req.params;
    const { selectedDate, selectedSlotId } = req.body;

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (req.user.role === "teacher" && booking.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access Denied: You can only reschedule your own bookings" });
        }

        if (!selectedDate || !selectedSlotId) {
            return res.status(400).json({ message: "Date and slot ID are required for rescheduling." });
        }

        const teacher = await Teacher.findById(booking.teacher);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        if (!teacher.availableSlots || teacher.availableSlots.length === 0) {
            return res.status(404).json({ message: "No available slots found for this teacher." });
        }

        const slot = teacher.availableSlots.find(s => s._id.toString() === selectedSlotId);
        if (!slot) {
            return res.status(404).json({ message: "Slot not found for this teacher." });
        }

        const selectedTime = slot.startTime;
        const combinedDateTime = new Date(`${selectedDate}T${selectedTime}`);

        if (isNaN(combinedDateTime)) {
            return res.status(400).json({ message: "Invalid date or slot time." });
        }

        const formattedDate = formatDate(combinedDateTime); // e.g. "Apr 21, 2025"
        const formattedDay = formatDay(combinedDateTime);   // e.g. "Monday"

        booking.date = combinedDateTime;
        booking.slotId = selectedSlotId;
        booking.startTime = slot.startTime;
        booking.endTime = slot.endTime;
        await booking.save();

        await createNotification(
            booking.student,
            "Booking Rescheduled",
            `Your booking with Teacher ${booking.teacher} has been rescheduled to ${formattedDay}, ${formattedDate} at ${slot.startTime} - ${slot.endTime}.`
        );

        await createNotification(
            booking.teacher,
            "Booking Rescheduled",
            `The booking with Student ${booking.student} has been rescheduled to ${formattedDay}, ${formattedDate} at ${slot.startTime} - ${slot.endTime}.`
        );

        res.json({
            message: "✅ Booking rescheduled successfully",
            booking: {
                _id: booking._id,
                student: booking.student,
                teacher: booking.teacher,
                day: formattedDay, // e.g. "Monday"
                date: formattedDate, // e.g. "Apr 21, 2025"
                startTime: slot.startTime,
                endTime: slot.endTime,
                status: booking.status
            }
        });

    } catch (error) {
        console.error("❌ Error in rescheduleBooking:", error);
        res.status(500).json({ message: "Error rescheduling booking" });
    }
};


// Cancel Booking
const cancelBooking = async (req, res) => {
    const { bookingId } = req.params;

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (req.user.role === "teacher" && booking.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access Denied: You can only cancel your own bookings" });
        }

        booking.status = "cancelled";
        booking.cancellationTime = new Date();
        await booking.save();

        await createNotification(booking.student, "Booking Cancellation", `Your booking with Teacher ${booking.teacher} has been cancelled.`);
        await createNotification(booking.teacher, "Booking Cancellation", `The booking with Student ${booking.student} has been cancelled.`);

        res.status(200).json({ message: "Booking cancelled successfully", booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error cancelling booking" });
    }
};

// delete booking by admin
const deleteBooking = async (req, res) => {
    const { bookingId } = req.params;

    try {
        // Find the booking by its ID
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if the user has permission to delete the booking
        if (req.user.role !== "admin" && booking.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to delete this booking" });
        }

        // Delete the booking using deleteOne or findByIdAndDelete
        await Booking.findByIdAndDelete(bookingId);

        res.json({ message: "Booking deleted successfully" });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ message: "Error deleting booking" });
    }
};

// Fetch available slots for a specific teacher on a given day
const getAvailableSlots = async (req, res) => {
    const { teacherId, day } = req.params;

    try {
        // Validate if 'day' is a valid date string
        if (!day || isNaN(new Date(day).getTime())) {
            return res.status(400).json({ message: "Invalid day format" });
        }

        // Fetch teacher data
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // Get available slots for the specific day and where slots are not booked
        const availableSlots = await AvailableSlot.find({
            teacher: teacherId,
            day, // match the day passed as a parameter
            isBooked: false, // only fetch available slots
        });

        if (availableSlots.length === 0) {
            return res.status(404).json({ message: "No available slots for the selected day" });
        }

        res.status(200).json({ availableSlots });

    } catch (error) {
        console.error("Error fetching available slots:", error);
        res.status(500).json({ message: "Error fetching available slots" });
    }
};


const addAvailableSlot = async (req, res) => {
    try {
        const { teacherId, day, startTime, endTime } = req.body;

        if (!teacherId || !day || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newSlot = new AvailableSlot({
            teacher: teacherId,
            day,
            startTime,
            endTime,
            isBooked: false
        });

        await newSlot.save();
        res.status(201).json({ message: "Slot added successfully", newSlot });
    } catch (error) {
        console.error("Error adding slot:", error);
        res.status(500).json({ message: "Error adding available slot" });
    }
};


module.exports = { createBooking, cancelBooking, rescheduleBooking, getAvailableSlots, addAvailableSlot, deleteBooking };
