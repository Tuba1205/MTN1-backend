const axios = require('axios');

const createZoomMeeting = async (topic, startTime, duration, accessToken, teacherEmail) => {
  const url = `https://api.zoom.us/v2/users/${teacherEmail}/meetings`;  // Use teacher's email here

  const headers = {
    Authorization: `Bearer ${accessToken}`,  // ✅ Use backticks for template literals
    'Content-Type': 'application/json',
  };

  const meetingDetails = {
    topic: topic,
    type: 2,  // 2 is for scheduled meetings
    start_time: startTime,  // Ensure it's in ISO 8601 format, e.g., '2025-03-16T15:00:00Z'
    duration: duration,  // Duration in minutes
    agenda: 'Class with teacher',
    timezone: 'America/New_York', // Or the appropriate timezone
  };

  try {
    const response = await axios.post(url, meetingDetails, { headers });
    return response.data;  // This will contain the Zoom meeting link and details
  } catch (error) {
    console.error('Error creating Zoom meeting:', error.response ? error.response.data : error.message);
    throw new Error(`Failed to create Zoom meeting: ${error.response ? error.response.data : error.message}`);
  }
};

module.exports = { createZoomMeeting };
