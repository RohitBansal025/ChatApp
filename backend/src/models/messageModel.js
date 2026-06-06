import mongoose from "mongoose";
import { encryptText, decryptText } from "../utils/encryption.js";

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.ObjectId, ref: "User" },

    message: {
      type: String,
      trim: true,
      // Encrypt the message right before it is stored in the database.
      set: encryptText,
      // Decrypt the message whenever it is read back out of the database.
      get: decryptText,
    },

    conversation: { type: mongoose.Schema.ObjectId, ref: "Conversation" },

    files: [],

    // Users who have read this message (used for read receipts).
    readBy: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    // Run getters (decryption) when documents are serialized for API responses.
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Speeds up fetching & sorting messages within a conversation.
messageSchema.index({ conversation: 1, createdAt: 1 });

// creating model for schema
const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;
