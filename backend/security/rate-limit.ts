import { AppError } from '../domain/errors.js';
export interface AttemptLimiter { check(key: string, max?: number, windowMs?: number): void | Promise<void> }
// Somente para desenvolvimento. Produção deverá usar contadores compartilhados no banco.
export class RateLimiter {
  private readonly entries = new Map<string, { count: number; until: number }>();
  constructor(private readonly now = Date.now) {}
  check(key: string, max = 10, windowMs = 60_000): void {
    const now = this.now();
    for (const [k, item] of this.entries) if (item.until <= now) this.entries.delete(k);
    let item = this.entries.get(key);
    if (!item) {
      if (this.entries.size >= 10_000) throw new AppError(429, 'RATE_LIMITED', 'Tente novamente em instantes.');
      item = { count: 0, until: now + windowMs }; this.entries.set(key, item);
    }
    if (++item.count > max) throw new AppError(429, 'RATE_LIMITED', 'Muitas tentativas. Aguarde um minuto.');
  }
}
