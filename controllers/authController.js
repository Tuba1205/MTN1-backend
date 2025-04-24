const axios = require('axios');
const Teacher = require('../models/Teacher'); // Import Teacher model
const { saveZoomAccessToken } = require('../utilis/zoomUtilis.js'); // Assuming the save function is in utils

// Callback route where Zoom redirects after the teacher authorizes
const oauthCallback = async (req, res) => {
  try {
    const code = req.query.code;  // The authorization code returned by Zoom
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const redirectUri = process.env.ZOOM_REDIRECT_URI;

    // Exchange the authorization code for an access token
    const response = await axios.post('https://zoom.us/oauth/token', null, {
        params: {
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        },
        headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
    });
    

    const accessToken = response.data.access_token;
    const teacherId = response.data.teacher_id;  // You should have this info based on the response

    // Save the Zoom access token in the teacher's database record
    await saveZoomAccessToken(teacherId, accessToken);

    // Respond back to the user
    res.status(200).json({ message: 'Access token saved successfully and teacher authenticated!' });
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.status(500).json({ message: 'Failed to complete OAuth process.' });
  }
};

module.exports = {
  oauthCallback,
};
