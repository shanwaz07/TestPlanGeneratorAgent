import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SECRETS_PATH = path.resolve(__dirname, '../../../.secrets.json');
const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET ?? 'default-change-this-in-prod!!32c';
  return crypto.scryptSync(secret, 'tp-gen-salt', 32);
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    tag: authTag.toString('hex'),
  });
}

export function decrypt(encryptedJson: string): string {
  const key = getKey();
  const { iv, data, tag } = JSON.parse(encryptedJson) as { iv: string; data: string; tag: string };
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

export function saveSecrets(updates: Record<string, string>): void {
  const existing = loadRawSecrets();
  for (const [key, value] of Object.entries(updates)) {
    existing[key] = encrypt(value);
  }
  fs.writeFileSync(SECRETS_PATH, JSON.stringify(existing, null, 2));
}

export function loadSecrets(): Record<string, string> {
  const raw = loadRawSecrets();
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    try {
      result[key] = decrypt(value);
    } catch {
      // skip corrupted entry
    }
  }
  return result;
}

export function deleteSecret(key: string): void {
  const raw = loadRawSecrets();
  delete raw[key];
  fs.writeFileSync(SECRETS_PATH, JSON.stringify(raw, null, 2));
}

function loadRawSecrets(): Record<string, string> {
  if (!fs.existsSync(SECRETS_PATH)) return {};
  return JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf8')) as Record<string, string>;
}
