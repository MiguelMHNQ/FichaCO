import { readSupabaseConfig } from './config.js';
import { PostgresRooms } from './adapters/postgres-rooms.js';

try {
  const config = readSupabaseConfig();
  if (!config) {
    console.error('Supabase não configurado. Preencha as três variáveis no .env.');
    process.exitCode = 1;
  } else {
    // SELECT real, sem gravar dados nem imprimir documentos, URLs ou credenciais.
    await PostgresRooms.connect(config).transaction(async tx => { await tx.get('000000'); });
    console.log('Supabase: conexão PostgreSQL e consulta autorizada OK. Verificação TLS ativa.');
  }
} catch (error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'CONFIG_OR_CONNECTION_ERROR';
  // Mensagens de drivers podem conter dados da conexão. Exibir somente código conhecido.
  const safeCode = /^[A-Z0-9_]{2,64}$/.test(code) ? code : 'CONNECTION_ERROR';
  console.error(`Supabase: não foi possível validar a conexão (${safeCode}).`);
  process.exitCode = 1;
}
