import { requireCondition } from './errors.js';
import type { Visibility } from './models.js';

export function object(value: unknown): Record<string, unknown> {
  requireCondition(value !== null && typeof value === 'object' && !Array.isArray(value), 400, 'INVALID_BODY', 'Envie um objeto JSON.');
  return value as Record<string, unknown>;
}
export function fields(data: Record<string, unknown>, allowed: string[]): void {
  requireCondition(Object.keys(data).every(key => allowed.includes(key)), 400, 'UNKNOWN_FIELD', 'A requisição contém campos não permitidos.');
}
export function name(value: unknown): string {
  requireCondition(typeof value === 'string', 400, 'INVALID_NAME', 'Informe um nome.');
  const result = value.trim().normalize('NFC');
  requireCondition(result.length > 0 && [...result].length <= 40 && !/[<>\p{Cc}\p{Cf}]/u.test(result), 400, 'INVALID_NAME', 'Use de 1 a 40 caracteres no nome, sem marcações ou controles.');
  return result;
}
export function roomCode(value: unknown): string {
  requireCondition(typeof value === 'string' && /^\d{6}$/.test(value), 400, 'INVALID_CODE', 'O código precisa ter seis dígitos.');
  return value;
}
export function visibility(value: unknown): Visibility {
  requireCondition(value === 'public' || value === 'private', 400, 'INVALID_VISIBILITY', 'Escolha uma sala pública ou privada.');
  return value;
}
export function capacity(value: unknown): number {
  requireCondition(typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 50, 400, 'INVALID_CAPACITY', 'O limite é de 1 a 50 pessoas, incluindo o dono.');
  return value;
}
export function password(value: unknown): string {
  requireCondition(typeof value === 'string' && [...value].length >= 1 && [...value].length <= 10, 400, 'INVALID_PASSWORD', 'Use de 1 a 10 caracteres na senha da sala.');
  return value;
}
export function color(value: unknown): string {
  requireCondition(typeof value === 'string' && /^#[\da-f]{6}$/i.test(value), 400, 'INVALID_COLOR', 'Informe uma cor hexadecimal válida.');
  return value.toLowerCase();
}
