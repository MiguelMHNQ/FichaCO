import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PasswordHash } from '../domain/models.js';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64) as Buffer;
  return { salt, hash: hash.toString('hex') };
}
export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const computed = await scrypt(password, stored.salt, 64) as Buffer;
  const expected = Buffer.from(stored.hash, 'hex');
  return computed.length === expected.length && timingSafeEqual(computed, expected);
}
