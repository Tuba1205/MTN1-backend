const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, required: true },  
    senderRole: { type: String, enum: ["student", "teacher", "admin"], required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true },  
    recipientRole: { type: String, enum: ["student", "teacher", "admin"], required: true },
    message: { type: String },
    fileUrl: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
