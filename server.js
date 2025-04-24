const express = require('express');
const cors = require('cors');
const http = require('http'); // HTTP module
const socketIo = require('socket.io'); // Import Socket.io
const connectDB = require('./config/db');
const cronJob = require('./services/cronJob.js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set up a cron job when the server starts
cronJob.start();

// App config
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins (change this in production)
    },
});

// ✅ Store Socket.io instance in the app
app.set("socketio", io);

// Connect to the database
connectDB();

// Middleware
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:5173", // Allow frontend
        credentials: true, // Allow cookies/auth headers
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);


// Default route
app.get('/', (req, res) => {
    res.send('Hello! API Working');
});

// Store connected users
const users = new Map();

// Socket.io events
io.on('connection', (socket) => {
   

    // User joins chat
    socket.on('join', (userId) => {
        users.set(userId, socket.id);
        console.log(`User ${userId} joined with socket ID: ${socket.id}`);
    });

    // Handle sending messages in real-time
    socket.on('sendMessage', async ({ senderId, recipientId, messageContent, fileUrl }) => {
        try {
            const Message = require('./models/Message');

            // Save message to DB
            const newMessage = new Message({
                sender: senderId,
                recipient: recipientId,
                message: messageContent,
                fileUrl: fileUrl || null, // Save file if exists
            });

            await newMessage.save();

            // Notify the recipient if online
            if (users.has(recipientId)) {
                io.to(users.get(recipientId)).emit('receiveMessage', newMessage);
            }

            console.log("Message sent:", newMessage);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        
        users.forEach((value, key) => {
            if (value === socket.id) {
                users.delete(key);
            }
        });
    });
});

// ✅ Store users map in app for global access
app.set("users", users);

// Routes
const authRoutes = require('./routes/authRoutes.js');
const studentRoutes = require('./routes/studentRoutes.js');
const teacherRoutes = require('./routes/teacherRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const bookingRoutes = require('./routes/bookingRoutes.js');
const analyticsRoutes = require('./routes/analyticsRoutes.js');
const messageRoutes = require('./routes/messageRoutes.js');
const classBookingRoutes = require('./routes/classBookingRoutes.js');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/classes', classBookingRoutes);

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
