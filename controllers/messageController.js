const Message = require("../models/Message");
const mongoose = require("mongoose");
const { createNotification } = require("./notificationController");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");


// ✅ Send a message (POST)
const sendMessage = async (req, res) => {
  try {
    const { senderId, senderRole, recipientId, recipientRole, messageContent } = req.body;

    // Check if the required fields are provided
    if (!senderId || !recipientId || !messageContent || !senderRole || !recipientRole) {
      return res.status(400).json({ error: "❌ All fields are required!" });
    }

    // Restriction: Block messages containing emails or phone numbers
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;

    if (emailRegex.test(messageContent) || phoneRegex.test(messageContent)) {
      return res.status(400).json({ error: "❌ Sharing email addresses or phone numbers is not allowed!" });
    }

    // Check if a file was uploaded, otherwise set fileUrl to null
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Create a new message
    const newMessage = new Message({
      sender: senderId,
      senderRole: senderRole,
      recipient: recipientId,
      recipientRole: recipientRole,
      message: messageContent,
      fileUrl: fileUrl,
      timestamp: new Date(),
    });

    // Save the message to the database
    await newMessage.save();

    console.log("✅ Message saved successfully:", newMessage);

    // Respond with success
    res.status(201).json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};


// ✅ Get chat users (GET)
const getChatUsers = async (req, res) => {
  try {
    const { userId, role } = req.params;
    console.log("📢 Fetching chat users for:", userId, "Role:", role);

    const objectIdUser = new mongoose.Types.ObjectId(userId);

    // ✅ Fetch Messages
    let messages = await Message.find({
      $or: [{ sender: objectIdUser }, { recipient: objectIdUser }],
    }).select("sender recipient");

    console.log("📩 Messages fetched:", messages);

    let userIds = new Set();

    messages.forEach((msg) => {
      if (msg.sender.toString() !== userId) userIds.add(msg.sender.toString());
      if (msg.recipient.toString() !== userId) userIds.add(msg.recipient.toString());
    });

    console.log("🔹 Unique user IDs:", [...userIds]);

    let users = [];

    if (role === "student") {
      console.log("🎓 Student detected. Fetching ALL teachers...");

      users = await Teacher.find({}).select("name email _id");

      if (users.length === 0) {
        console.warn("⚠️ No teachers found in the database.");
      }

    } else if (role === "teacher") {
      console.log("🧑‍🏫 Teacher detected. Fetching ONLY students they have chatted with...");

      if (userIds.size > 0) {
        const objectIds = Array.from(userIds).map(id => new mongoose.Types.ObjectId(id));

        users = await Student.find({
          _id: { $in: objectIds }
        }).select("name email _id");

        if (users.length === 0) {
          console.warn("⚠️ No students found who have chatted with this teacher.");
        }
      } else {
        console.warn("⚠️ No chat history found for this teacher.");
      }

    } else if (role === "admin") {
      console.log("👨‍💼 Admin detected. Fetching ALL users they have messaged...");

      if (userIds.size > 0) {
        const objectIds = Array.from(userIds).map(id => new mongoose.Types.ObjectId(id));

        const students = await Student.find({ _id: { $in: objectIds } }).select("name email _id");
        const teachers = await Teacher.find({ _id: { $in: objectIds } }).select("name email _id");

        users = [...students, ...teachers];

        if (users.length === 0) {
          console.warn("⚠️ No users found who have chatted with this admin.");
        }
      } else {
        console.warn("⚠️ No chat history found for this admin.");
      }
    }

    console.log("✅ Final chat users list:", users);
    res.json({ users });
  } catch (error) {
    console.error("❌ Error fetching chat users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};


// ✅ Get messages (GET)
const getMessages = async (req, res) => {
  try {
    const { userId, role } = req.params;

    console.log("🛠 Fetching messages for user:", userId, "Role:", role);

    let filter;

    // Admin can see all messages
    if (role === "admin") {
      filter = {};
    } else {
      // Student and Teacher can see only their own messages
      filter = {
        $or: [
          { sender: userId },
          { recipient: userId },
        ],
      };
    }

    const messages = await Message.find(filter).sort({ timestamp: 1 });

    console.log("📩 Retrieved Messages:", messages);

    res.status(200).json({ messages });

    console.log("📩 Messages fetched:", messages.map(msg => ({
      id: msg._id,
      sender: msg.sender,
      senderRole: msg.senderRole,
      recipient: msg.recipient,
      recipientRole: msg.recipientRole,
      message: msg.message
    })));

  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const adminStartChat = async (req, res) => {
  try {
    const { adminId, studentId, teacherId, initialMessage } = req.body;

    if (!adminId || !studentId || !teacherId || !initialMessage) {
      return res.status(400).json({ error: "❌ All fields are required!" });
    }

    // Ensure Student and Teacher exist
    const studentExists = await Student.findById(studentId);
    const teacherExists = await Teacher.findById(teacherId);
    if (!studentExists || !teacherExists) {
      return res.status(404).json({ error: "❌ Student or Teacher not found!" });
    }

    // Admin sends the first message to the student
    const messageToStudent = new Message({
      sender: adminId,
      senderRole: "admin",
      recipient: studentId,
      recipientRole: "student",
      message: `Admin: ${initialMessage}`,
      timestamp: new Date(),
    });

    await messageToStudent.save();

    // Admin sends the first message to the teacher
    const messageToTeacher = new Message({
      sender: adminId,
      senderRole: "admin",
      recipient: teacherId,
      recipientRole: "teacher",
      message: `Admin: ${initialMessage}`,
      timestamp: new Date(),
    });

    await messageToTeacher.save();

    res.status(201).json({
      message: "✅ Chat initiated successfully between Student & Teacher.",
      messages: [messageToStudent, messageToTeacher],
    });

  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};



module.exports = { sendMessage, getMessages, getChatUsers, adminStartChat };
