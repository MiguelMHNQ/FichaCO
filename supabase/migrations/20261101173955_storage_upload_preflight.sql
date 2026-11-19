create or replace function private.tabletop_upload_allowed(asset_path text,metadata jsonb)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.tabletop_uploads u where u.path=asset_path and u.uploaded_by=(select auth.uid()) and u.expires_at>now()
 and coalesce(metadata->>'size',metadata->>'contentLength') ~ '^[0-9]+$'
 and coalesce(metadata->>'size',metadata->>'contentLength')::numeric between 1 and u.bytes
 and metadata->>'mimetype'=u.mime and private.tabletop_role(u.room_code) in ('owner','moderator'))
$$;
