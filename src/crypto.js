import os from 'os';
import crypto from 'crypto';

// Generate machine-specific key based on machine ID
export function getMachineKey() {
  const machineId = os.hostname(); // or use a more unique machine identifier
  return crypto.createHash('sha256').update(machineId).digest('hex').substring(0, 32);
}

// Encrypt API key before storing
export function encryptApiKey(apiKey) {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    getMachineKey(),
    Buffer.alloc(16, 0) // IV - could be made more secure
  );
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt API key when reading
export function decryptApiKey(encryptedKey) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', getMachineKey(), Buffer.alloc(16, 0));
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('Decryption failed - possibly wrong machine?');
    return null;
  }
}
