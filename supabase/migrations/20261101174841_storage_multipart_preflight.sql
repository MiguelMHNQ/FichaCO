-- Pré-checagem de multipart pode informar só o MIME. O Storage repete a política com o tamanho real ao concluir.
create or replace function private.tabletop_upload_allowed(asset_path text,metadata jsonb)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.tabletop_uploads u where u.path=asset_path and u.uploaded_by=(select auth.uid()) and u.expires_at>now()
 and metadata->>'mimetype'=u.mime
 and (case when metadata ? 'size' then (metadata->>'size') ~ '^[0-9]+$' and (metadata->>'size')::numeric between 1 and u.bytes
 else (metadata->>'contentLength' is null or ((metadata->>'contentLength') ~ '^[0-9]+$' and (metadata->>'contentLength')::numeric between 1 and 52428800)) end)
 and private.tabletop_role(u.room_code) in ('owner','moderator'))
$$;
