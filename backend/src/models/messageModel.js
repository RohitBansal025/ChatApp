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
  },
  {
    timestamps: true,
    // Run getters (decryption) when documents are serialized for API responses.
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// creating model for schema
const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;
