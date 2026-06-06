# PRD — ChatApp (TwinkConnect) Message Encryption-at-Rest

## Original Problem Statement
Existing MERN chat app (https://github.com/RohitBansal025/ChatApp). Add encryption so
chat messages are stored in the database in ENCRYPTED form, but shown as PLAIN TEXT in
the app/website. "Don't change anything else, just add encryption/decryption."

## User Choices (confirmed)
- Level: Server-side encryption-at-rest (not client-side E2E).
- Key: Single secret in backend `.env`.
- Algorithm: easiest secure option -> AES-256-GCM.
- Scope: Only NEW messages encrypted; existing plaintext stays readable.
- Delivery: User pushes to GitHub themselves via "Save to Github".

## Architecture / Approach
Centralized at the Mongoose Message model level so every read/write path is covered
with minimal code change and zero changes to controllers/sockets/frontend.
- `backend/src/utils/encryption.js` (NEW): AES-256-GCM encrypt/decrypt.
  - Format: `enc::v1::base64(iv | authTag | ciphertext)`.
  - Idempotent (no double-encrypt); legacy plaintext passes through on read;
    fail-safe decrypt never throws. Key derived via SHA-256 from MESSAGE_ENCRYPTION_KEY.
- `backend/src/models/messageModel.js` (MODIFIED): `message` field gets
  `set: encryptText` + `get: decryptText`; schema `toJSON/toObject { getters: true }`.
- `backend/.env.example` (NEW): documents required `MESSAGE_ENCRYPTION_KEY` (+ others).
- `backend/.env` (local only, gitignored): contains test key, NOT pushed.

Why it covers everything: no `.lean()` is used anywhere, so getters apply on all reads —
`getConvoMessages`, `populateMessage`, and the nested `latestMessage` in conversation lists.
Realtime socket broadcast forwards the sender's plaintext object directly (unaffected),
while the DB copy is encrypted.

## What's Implemented (2026-06-06)
- AES-256-GCM encryption-at-rest for chat messages. VERIFIED with two test suites:
  1) util unit tests (roundtrip, idempotency, random IV, legacy passthrough),
  2) real service-flow tests (createMessage stores ciphertext; populateMessage,
     getConvoMessages, getUserConversations all return plaintext; legacy plaintext readable).
- Server boots cleanly (`Server on port 5000`, DB connect OK). Test scripts removed after.

## IMPORTANT — Deployment Note
`.env` is gitignored, so `MESSAGE_ENCRYPTION_KEY` is NOT pushed. The user MUST set
`MESSAGE_ENCRYPTION_KEY` in their backend/hosting environment (Vercel/Render/etc).
Generate with: `openssl rand -base64 48`. Keep it STABLE and SECRET — changing it makes
previously encrypted messages unreadable.

## Backlog / Future (P1/P2)
- P1: One-time migration script to encrypt existing plaintext messages (user chose "new only").
- P2: Encrypt media/file metadata or filenames if sensitive.
- P2: Key rotation strategy (version prefix `v1` already supports adding `v2`).
- P2: True end-to-end (client-held keys) if zero server-trust is ever required.
