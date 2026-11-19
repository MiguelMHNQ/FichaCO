CREATE TABLE private.characters (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  last_mutation uuid NOT NULL,
  import_key text CHECK (import_key IS NULL OR import_key ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT character_document_object CHECK (jsonb_typeof(document) = 'object'),
  CONSTRAINT character_document_size CHECK (octet_length(document::text) <= 1048576),
  CONSTRAINT character_document_id CHECK (document->>'id' = id::text),
  CONSTRAINT character_document_level CHECK ((document->>'nivel')::integer BETWEEN 1 AND 100),
  UNIQUE (owner_id, import_key)
);
CREATE INDEX characters_owner_active ON private.characters (owner_id, updated_at DESC, id) WHERE deleted_at IS NULL;
REVOKE ALL ON private.characters FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON private.characters TO primordios_backend;
ALTER TABLE private.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.characters FORCE ROW LEVEL SECURITY;
-- Contexto definido apenas no backend, dentro da transação, a partir do token verificado.
CREATE POLICY backend_own_characters_select ON private.characters FOR SELECT TO primordios_backend
  USING (owner_id = (SELECT nullif(current_setting('primordios.user_id', true), '')::uuid));
CREATE POLICY backend_own_characters_insert ON private.characters FOR INSERT TO primordios_backend
  WITH CHECK (owner_id = (SELECT nullif(current_setting('primordios.user_id', true), '')::uuid));
CREATE POLICY backend_own_characters_update ON private.characters FOR UPDATE TO primordios_backend
  USING (owner_id = (SELECT nullif(current_setting('primordios.user_id', true), '')::uuid))
  WITH CHECK (owner_id = (SELECT nullif(current_setting('primordios.user_id', true), '')::uuid));
COMMENT ON TABLE private.characters IS 'Fichas privadas por usuário; revisão otimista, tentativas idempotentes e exclusão lógica.';
