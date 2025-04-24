const { google } = require('googleapis');

// Create a function to create an event on Google Calendar
async function createCalendarEvent(accessToken, bookingDetails) {
    try {
        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        // Initialize the Calendar API
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Format the start and end times for the event
        const eventStartTime = new Date(bookingDetails.startTime);
        const eventEndTime = new Date(eventStartTime.getTime() + bookingDetails.duration * 60000); // duration is in minutes

        const event = {
            summary: `Class with ${bookingDetails.teacherName}`,
            location: 'Online',
            description: `Class with ${bookingDetails.teacherName} and ${bookingDetails.studentEmail}`,
            start: {
                dateTime: eventStartTime,
                timeZone: 'UTC',
            },
            end: {
                dateTime: eventEndTime,
                timeZone: 'UTC',
            },
            attendees: [
                { email: bookingDetails.studentEmail },
                { email: bookingDetails.teacherEmail },
            ],
            reminders: {
                useDefault: true,
            },
        };

        // Insert the event into the Google Calendar
        const res = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        console.log('Event created: %s', res.data.htmlLink);
        return res.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        throw new Error('Failed to create Google Calendar event');
    }
}

module.exports = { createCalendarEvent };
