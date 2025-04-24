const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin', 'salesperson'],
        default: 'student',
    },
    profileDetails: {
        type: Object,
        default: {},
    },
    zoomAccessToken: { // Allow zoomAccessToken to be optional
        type: String,
        default: null, // Default value
    },
});

module.exports = mongoose.model('User', userSchema);
