import { readSupabaseConfig } from './config.js';
import { PostgresRooms } from './adapters/postgres-rooms.js';
import { SupabaseAuth } from './adapters/supabase-auth.js';
import { RoomService } from './domain/rooms.js';
import type { ApiOptions } from './http/api.js';
import { createPostgresPool } from './adapters/postgres.js';
import { PostgresCharacters } from './adapters/postgres-characters.js';
import { CharacterService } from './domain/characters.js';
import { TabletopService } from './domain/tabletop.js';
import { PostgresUploads } from './adapters/postgres-uploads.js';
import { requestLimits } from './security/request-limit.js';

export function configuredOptions(): ApiOptions | undefined {
  const config = readSupabaseConfig();
  if (!config) return undefined;
  const auth = SupabaseAuth.connect(config.url, config.publishableKey);
  const pool = createPostgresPool(config);
  const database = new PostgresRooms(pool);
  const uploads = new PostgresUploads(pool);
  return {
    mode: 'supabase',
    publicAuth: { url: config.url, publishableKey: config.publishableKey },
    rooms: new RoomService(database, undefined, undefined, database),
    tabletop: new TabletopService(database, undefined, database),
    characters: new CharacterService(new PostgresCharacters(pool)),
    limitCharacters: (user, write) => database.check(`characters:${write ? 'write' : 'read'}:${user.id}`, 120),
    authenticate: request => auth.authenticate(request),
    limitRequest: requestLimits(database),
    reserveUpload: (user,code,input) => uploads.reserve(user,code,input)
  };
}
