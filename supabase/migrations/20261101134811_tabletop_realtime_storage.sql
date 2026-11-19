-- Somente recursos novos do TableTop. Salas/fichas existentes permanecem privadas.
create or replace function private.tabletop_role(room_code text)
returns text language sql stable security definer set search_path = '' as $$
  select m->>'role' from private.rooms r
  cross join lateral jsonb_array_elements(r.document->'members') m
  where r.code=room_code and not coalesce((r.document->>'closed')::boolean,true)
    and m->>'userId'=(select auth.uid())::text limit 1
$$;
revoke all on function private.tabletop_role(text) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.tabletop_role(text) to authenticated;

create or replace function private.tabletop_asset_visible(asset_name text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare role_name text; doc jsonb;
begin
  role_name:=private.tabletop_role(split_part(asset_name,'/',1));
  if role_name is null then return false; end if;
  if role_name in ('owner','moderator') then return true; end if;
  select document->'tabletop' into doc from private.rooms where code=split_part(asset_name,'/',1);
  if doc#>>'{audio,source,path}'=asset_name or doc#>>'{video,source,path}'=asset_name then return true; end if;
  return exists (
    select 1 from jsonb_array_elements(coalesce(doc#>'{scene,imagens}','[]'::jsonb)) i
    join jsonb_array_elements(coalesce(doc#>'{scene,camadas}','[]'::jsonb)) c on c->>'id'=i->>'camadaId'
    where (i->>'src'=asset_name or i->>'srcSeg'=asset_name)
      and coalesce((i->>'visivel')::boolean,true) and coalesce((c->>'visivel')::boolean,true)
  );
end $$;
revoke all on function private.tabletop_asset_visible(text) from public,anon,authenticated;
grant execute on function private.tabletop_asset_visible(text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('tabletop-assets','tabletop-assets',false,52428800,array['image/png','image/jpeg','image/webp','image/gif','audio/mpeg','audio/ogg','audio/wav','audio/x-wav','audio/mp4','audio/webm','video/mp4','video/webm'])
on conflict(id) do nothing;
do $$ begin if exists(select 1 from storage.buckets where id='tabletop-assets' and public) then raise exception 'O bucket TableTop deve ser privado'; end if; end $$;

create policy tabletop_assets_read on storage.objects for select to authenticated
using (bucket_id='tabletop-assets' and private.tabletop_asset_visible(name));
create policy tabletop_assets_insert on storage.objects for insert to authenticated
with check (bucket_id='tabletop-assets' and name ~ '^[0-9]{6}/[a-f0-9-]{36}\.[a-z0-9]{1,5}$' and private.tabletop_role(split_part(name,'/',1)) in ('owner','moderator'));
create policy tabletop_assets_delete on storage.objects for delete to authenticated
using (bucket_id='tabletop-assets' and private.tabletop_role(split_part(name,'/',1)) in ('owner','moderator'));

create policy tabletop_realtime_read on realtime.messages for select to authenticated
using (((select realtime.topic()) ~ '^tabletop:[0-9]{6}$' or (select realtime.topic()) ~ '^laser:[0-9]{6}:[a-f0-9-]{36}$') and private.tabletop_role(split_part((select realtime.topic()),':',2)) is not null);
create policy tabletop_realtime_laser_write on realtime.messages for insert to authenticated
with check ((select realtime.topic()) ~ '^laser:[0-9]{6}:[a-f0-9-]{36}$' and split_part((select realtime.topic()),':',3)=(select auth.uid())::text and private.tabletop_role(split_part((select realtime.topic()),':',2)) is not null);

create or replace function private.tabletop_notify_room()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Nunca transmitir document/OLD/NEW: eles incluem senha, banimentos e camadas ocultas.
  perform realtime.send(jsonb_build_object('code',new.code,'version',new.document->'version'),'changed','tabletop:'||new.code,true);
  return null;
end $$;
revoke all on function private.tabletop_notify_room() from public,anon,authenticated;
create trigger tabletop_room_notify after insert or update on private.rooms
for each row execute function private.tabletop_notify_room();
