const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// Initialize OAuth2 client with your credentials
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,     // Your Client ID
  process.env.GOOGLE_CLIENT_SECRET, // Your Client Secret
  'http://localhost:4000/oauth2callback'  // Your redirect URI (update it if needed)
);

// Generate the Google auth URL
const getAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar', // Full access to Google Calendar
    'https://www.googleapis.com/auth/userinfo.profile', // To get user info
    'https://www.googleapis.com/auth/userinfo.email' // To get user email
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',  // To get a refresh token for long-term access
    scope: scopes,
  });
};

// Get the OAuth2 client
const getOAuthClient = () => {
  return oauth2Client;
};

// Get the credentials after the user authorizes
const getTokens = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);  // Store tokens
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Error getting tokens');
  }
};

module.exports = { getAuthUrl, getTokens, getOAuthClient };
