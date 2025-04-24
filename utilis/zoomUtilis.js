// utils/zoomUtils.js
const TeacherModel = require('../models/Teacher');  // Assuming this is where teacher data is stored

// Function to get the access token for a teacher
const getAccessTokenForUser = async (teacherId) => {
  try {
    const teacher = await TeacherModel.findById(teacherId); // Find the teacher by ID
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    return teacher.zoomAccessToken;  // Assuming the access token is stored in `zoomAccessToken` field
  } catch (error) {
    console.error('Error retrieving access token:', error);
    throw new Error('Failed to retrieve access token');
  }
};

module.exports = { getAccessTokenForUser };
