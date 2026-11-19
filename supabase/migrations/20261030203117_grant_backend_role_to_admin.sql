-- PostgreSQL 17 pode criar a associação administrativa com SET FALSE.
-- Permite ao administrador validar políticas usando a identidade restrita.
-- Nenhum papel do navegador recebe esta associação.
GRANT primordios_backend TO postgres WITH SET TRUE;
