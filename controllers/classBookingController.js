const { createZoomMeeting } = require('../utilis/zoomIntegration.js');
const TeacherModel = require('../models/Teacher.js');
const mongoose = require('mongoose');
const ClassBooking = require('../models/ClassBooking.js');

// Function to retrieve the access token for a teacher
const getAccessTokenForUser = async (teacherId) => {
  try {
    console.log("Looking for teacher with ID:", teacherId);

    // Ensure ID is valid
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new Error("Invalid teacher ID format");
    }

    // Find the teacher in the Teacher collection
    const teacher = await TeacherModel.findById(teacherId);

    if (!teacher) {
      console.log("Teacher not found:", teacherId);
      throw new Error("Teacher not found");
    }

    console.log("Teacher found:", teacher); 

    if (!teacher.zoomAccessToken) {
      throw new Error("Teacher has no Zoom access token. Please link your Zoom account.");
    }

    return teacher.zoomAccessToken;
  } catch (error) {
    console.error("Error retrieving access token:", error);
    throw new Error("Failed to retrieve access token");
  }
};

// This function handles the class booking process and integrates Zoom
const scheduleClassWithZoom = async (req, res) => {
  try {
    const { studentId, teacherId, startTime, duration } = req.body;
    console.log(`Scheduling class with teacher ID: ${teacherId} and student ID: ${studentId}`);

    // Retrieve the access token for the teacher
    const accessToken = await getAccessTokenForUser(teacherId);
    
    if (!accessToken) {
      console.error(`No valid access token found for teacher ${teacherId}`);
      return res.status(400).json({ message: 'No valid access token found for teacher.' });
    }

    // Create Zoom meeting
    const classTopic = `Class with Teacher ${teacherId}`;

    if (!studentId || !teacherId || !startTime || !duration) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const zoomMeeting = await createZoomMeeting(classTopic, startTime, duration, accessToken, teacher.email);

    if (!zoomMeeting || !zoomMeeting.join_url) {
      throw new Error('Zoom meeting creation failed or missing join_url.');
    }

    // Save class booking to the database
    const newClassBooking = new ClassBooking({
      studentId,
      teacherId,
      startTime,
      zoomLink: zoomMeeting.join_url,
      status: 'scheduled',
    });
    
    await newClassBooking.save();
    
    res.status(200).json({
      message: 'Class scheduled successfully with Zoom meeting link!',
      zoomLink: zoomMeeting.join_url
    });
  } catch (error) {
    console.error('Error scheduling class with Zoom:', error);
    res.status(500).json({ message: 'Failed to schedule class with Zoom.' });
  }
};

module.exports = {
  scheduleClassWithZoom,
};
