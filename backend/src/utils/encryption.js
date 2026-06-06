import crypto from "crypto";

/**
 * Message encryption-at-rest utility.
 *
 * Uses AES-256-GCM (authenticated encryption) so stored messages are both
 * confidential and tamper-evident. A single secret (MESSAGE_ENCRYPTION_KEY)
 * from the environment is used to derive the 256-bit key.
 *
 * Encrypted values are stored as:  enc::v1::<base64( iv | authTag | cipher )>
 * The version prefix lets us detect already-encrypted vs legacy plaintext
 * values, so only NEW messages are encrypted while old plaintext messages
 * remain perfectly readable.
 */

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_PREFIX = "enc::v1::";
const IV_LENGTH = 12; // recommended nonce length for GCM
const AUTH_TAG_LENGTH = 16;

let cachedKey = null;

const getEncryptionKey = () => {
  if (cachedKey) return cachedKey;

  const secret = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY is not set. Add it to your backend .env to enable message encryption."
    );
  }

  // Derive a deterministic 32-byte (256-bit) key from the provided secret.
  cachedKey = crypto.createHash("sha256").update(String(secret)).digest();
  return cachedKey;
};

// True only for values produced by encryptText() below.
export const isEncrypted = (value) =>
  typeof value === "string" && value.startsWith(ENCRYPTION_PREFIX);

/**
 * Encrypt a plaintext string before it is written to the database.
 * - Empty / null / undefined values are returned untouched.
 * - Already-encrypted values are returned as-is (idempotent, no double-encrypt).
 */
export const encryptText = (plainText) => {
  if (plainText === undefined || plainText === null || plainText === "") {
    return plainText;
  }
  if (isEncrypted(plainText)) return plainText;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, authTag, encrypted]).toString("base64");
  return ENCRYPTION_PREFIX + payload;
};

/**
 * Decrypt a value read from the database back into plaintext.
 * - Legacy plaintext (no prefix) is returned unchanged, so existing messages
 *   keep working without any migration.
 * - If decryption fails for any reason, the stored value is returned rather
 *   than throwing, so reads never crash.
 */
export const decryptText = (value) => {
  if (!isEncrypted(value)) return value;

  try {
    const payload = Buffer.from(value.slice(ENCRYPTION_PREFIX.length), "base64");
    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (error) {
    return value;
  }
};
