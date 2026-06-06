import createHttpError from "http-errors";

// Maximum allowed length for a single chat message (in characters).
export const MAX_MESSAGE_LENGTH = 10000;

/**
 * Validate & normalize message content before it is stored.
 * - Rejects empty messages that also have no files.
 * - Rejects messages longer than MAX_MESSAGE_LENGTH.
 * Returns the trimmed message text.
 */
export const validateMessageContent = (message, files) => {
  const hasFiles = Array.isArray(files) && files.length > 0;
  const text = typeof message === "string" ? message.trim() : "";

  if (!text && !hasFiles) {
    throw createHttpError.BadRequest("Message cannot be empty");
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    throw createHttpError.BadRequest(
      `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`
    );
  }

  return text;
};
