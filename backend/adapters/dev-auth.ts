import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Principal } from '../domain/models.js';
import { AppError } from '../domain/errors.js';
// Identidades descartáveis para localhost; não são as contas do frontend nem contas reais.
export class DevAuth {
  private readonly tokens = new Map<string, { user: Principal; expiresAt: number }>();
  constructor(private readonly now = Date.now) {}
  create(displayName: string) {
    for (const [token, entry] of this.tokens) if (entry.expiresAt <= this.now()) this.tokens.delete(token);
    if (this.tokens.size >= 100) throw new AppError(429, 'RATE_LIMITED', 'Limite de identidades locais atingido.');
    const token = randomBytes(32).toString('base64url');
    const user = { id: randomUUID(), displayName }; const expiresAt = this.now() + 8 * 60 * 60 * 1000;
    this.tokens.set(token, { user, expiresAt }); return { token, user: { ...user }, expiresAt };
  }
  async authenticate(request: IncomingMessage): Promise<Principal> {
    const token = request.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    const entry = token ? this.tokens.get(token) : undefined;
    if (!entry || entry.expiresAt <= this.now()) throw new AppError(401, 'UNAUTHENTICATED', 'Identidade local ausente ou expirada.');
    return { ...entry.user };
  }
}
