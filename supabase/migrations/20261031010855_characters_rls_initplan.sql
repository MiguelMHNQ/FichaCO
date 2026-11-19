-- Subconsulta direta da configuração: um InitPlan por instrução, não por linha.
ALTER POLICY backend_own_characters_select ON private.characters
  USING (owner_id = nullif((SELECT current_setting('primordios.user_id', true)), '')::uuid);
ALTER POLICY backend_own_characters_insert ON private.characters
  WITH CHECK (owner_id = nullif((SELECT current_setting('primordios.user_id', true)), '')::uuid);
ALTER POLICY backend_own_characters_update ON private.characters
  USING (owner_id = nullif((SELECT current_setting('primordios.user_id', true)), '')::uuid)
  WITH CHECK (owner_id = nullif((SELECT current_setting('primordios.user_id', true)), '')::uuid);
