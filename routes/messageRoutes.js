const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, getChatUsers, adminStartChat } = require("../controllers/messageController"); // Remove 'upload' here
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const mongoose = require("mongoose");
const Message = require("../models/Message");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save files in 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

const upload = multer({ storage: storage }); // Declare 'upload' here

// ✅ Send a message (POST)
router.post("/send", upload.single("file"), sendMessage); // Handle file upload for send message

// ✅ Get messages (GET)
router.get("/get/:userId/:role", getMessages); // userId and role as URL params

router.get("/users/:userId/:role", getChatUsers);

router.post("/admin/start-chat", adminStartChat);

router.get("/chat-users/:userId", async (req, res) => {
  try {
      const { userId } = req.params;
      console.log("🔍 Fetching users for:", userId);

      // ✅ Convert userId to ObjectId
      const objectId = new mongoose.Types.ObjectId(userId);

      const users = await Message.distinct("recipient", { sender: objectId });
      console.log("👥 Users found:", users);

      res.json({ users });
  } catch (error) {
      console.error("❌ Error fetching chat users:", error);
      res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
