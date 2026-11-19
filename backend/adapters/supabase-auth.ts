import type { IncomingMessage } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import type { Principal } from '../domain/models.js';
import { AppError, requireCondition } from '../domain/errors.js';

interface VerifiedUser { id: string; user_metadata?: { display_name?: unknown; primordios_profile_complete?: unknown } }
export type VerifyUser = (token: string) => Promise<{ user: VerifiedUser | null; unavailable?: boolean }>;

export class SupabaseAuth {
  constructor(private readonly verify: VerifyUser) {}

  static connect(url: string, key: string): SupabaseAuth {
    // Sem sessão global compartilhada entre requisições de usuários diferentes.
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }) }
    });
    return new SupabaseAuth(async token => {
      const { data, error } = await client.auth.getUser(token);
      return { user: data.user, unavailable: !!error && (!error.status || error.status >= 500 || error.status === 429) };
    });
  }

  async authenticate(request: IncomingMessage): Promise<Principal> {
    const header = request.headers.authorization;
    requireCondition(typeof header === 'string' && header.length <= 16_384, 401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.');
    const match = /^Bearer ([^\s]+)$/i.exec(header);
    requireCondition(match?.[1], 401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.');
    let verified: Awaited<ReturnType<VerifyUser>>;
    try { verified = await this.verify(match[1]); }
    catch { throw new AppError(503, 'AUTH_UNAVAILABLE', 'Não foi possível verificar o login. Tente novamente.'); }
    requireCondition(!verified.unavailable, 503, 'AUTH_UNAVAILABLE', 'Não foi possível verificar o login. Tente novamente.');
    requireCondition(verified.user, 401, 'UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.');
    const displayName = verified.user.user_metadata?.display_name;
    requireCondition(verified.user.user_metadata?.primordios_profile_complete === true && typeof displayName === 'string' && [...displayName.trim()].length >= 3 && [...displayName.trim()].length <= 40 && !/[<>\p{Cc}\p{Cf}]/u.test(displayName), 403, 'PROFILE_INCOMPLETE', 'Escolha seu nome público para continuar.');
    // Metadados editáveis servem apenas para apresentação, nunca para permissões.
    return { id: verified.user.id, displayName: displayName.trim().normalize('NFC') };
  }
}
