import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure the key is exactly 32 bytes.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32)
  : crypto.scryptSync('nexora_default_secret_encryption_key', 'salt', 32);
const IV_LENGTH = 16;

/**
 * Encrypts clear text.
 * @param {string} text
 * @returns {string} Encrypted text in format iv:encrypted
 */
export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts encrypted text.
 * @param {string} text Encrypted text in format iv:encrypted
 * @returns {string} Decrypted text
 */
export function decrypt(text) {
  if (!text) return null;
  const parts = text.split(':');
  if (parts.length !== 2) return null;
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
