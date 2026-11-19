export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  databaseUrl: string;
  databaseCa?: string;
}

// Configuração parcial nunca deve habilitar silenciosamente o modo de memória.
export function readSupabaseConfig(env: NodeJS.ProcessEnv = process.env): SupabaseConfig | undefined {
  const values = [env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, env.SUPABASE_DB_URL];
  if (values.every(value => !value?.trim())) return undefined;
  if (values.some(value => !value?.trim())) throw new Error('Preencha SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e SUPABASE_DB_URL.');
  if (!values[1]!.trim().startsWith('sb_publishable_')) throw new Error('Use uma publishable key (sb_publishable_), nunca uma chave secreta ou service_role.');
  let url: URL, database: URL;
  try { url = new URL(values[0]!); database = new URL(values[2]!); }
  catch { throw new Error('URL do Supabase ou conexão PostgreSQL inválida. Confira o arquivo .env.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SUPABASE_URL deve ser a URL HTTPS do projeto.');
  }
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('SUPABASE_DB_URL deve ser uma conexão PostgreSQL.');
  if (!/^primordios_backend(?:\.[a-z0-9]+)?$/.test(decodeURIComponent(database.username))) {
    throw new Error('Use a role restrita primordios_backend na conexão do banco, em vez da conta administrativa.');
  }
  return {
    url: url.origin,
    publishableKey: values[1]!.trim(),
    databaseUrl: values[2]!,
    ...(env.SUPABASE_DB_CA ? { databaseCa: env.SUPABASE_DB_CA.replace(/\\n/g, '\n') } : {})
  };
}
