const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    message: {
      type: String,
    },
    file: {
      type: String,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    time: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
