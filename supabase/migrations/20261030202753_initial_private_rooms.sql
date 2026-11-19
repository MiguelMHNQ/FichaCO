-- Aplicação acessa estas tabelas somente pelo backend e com uma role restrita.
-- A senha da role deve ser definida no painel, fora do repositório.
CREATE ROLE primordios_backend LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO primordios_backend;

CREATE TABLE private.rooms (
  code text PRIMARY KEY CHECK (code ~ '^[0-9]{6}$'),
  document jsonb NOT NULL,
  CONSTRAINT room_document_code CHECK (document->>'code' = code),
  CONSTRAINT room_document_object CHECK (jsonb_typeof(document) = 'object'),
  CONSTRAINT room_capacity CHECK ((document->>'maxPlayers')::integer BETWEEN 1 AND 50),
  CONSTRAINT room_members CHECK (jsonb_typeof(document->'members') = 'array'),
  CONSTRAINT room_occupancy CHECK (jsonb_array_length(document->'members') <= (document->>'maxPlayers')::integer),
  CONSTRAINT room_visibility CHECK (document->>'visibility' IN ('public', 'private'))
);
CREATE INDEX rooms_open_code ON private.rooms (code) WHERE NOT (document->>'closed')::boolean;

CREATE TABLE private.api_attempts (
  key text PRIMARY KEY,
  count integer NOT NULL CHECK (count > 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX api_attempts_expiry ON private.api_attempts (expires_at);

REVOKE ALL ON private.rooms, private.api_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON private.rooms, private.api_attempts TO primordios_backend;

ALTER TABLE private.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.api_attempts ENABLE ROW LEVEL SECURITY;

-- A role representa o servidor. A autorização por jogador é feita no RoomService;
-- esta role não é concedida aos papéis de navegador, nem possui BYPASSRLS.
CREATE POLICY backend_read_rooms ON private.rooms FOR SELECT TO primordios_backend USING (true);
CREATE POLICY backend_insert_rooms ON private.rooms FOR INSERT TO primordios_backend WITH CHECK (true);
CREATE POLICY backend_update_rooms ON private.rooms FOR UPDATE TO primordios_backend USING (true) WITH CHECK (true);
CREATE POLICY backend_read_attempts ON private.api_attempts FOR SELECT TO primordios_backend USING (true);
CREATE POLICY backend_insert_attempts ON private.api_attempts FOR INSERT TO primordios_backend WITH CHECK (true);
CREATE POLICY backend_update_attempts ON private.api_attempts FOR UPDATE TO primordios_backend USING (true) WITH CHECK (true);

COMMENT ON TABLE private.rooms IS 'Estado privado das salas; contém hashes de senha. Nunca expor na Data API ou Realtime.';
COMMENT ON TABLE private.api_attempts IS 'Contadores compartilhados entre instâncias do backend; sem dados de credenciais.';
