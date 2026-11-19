-- Quotas reservadas no backend e verificadas novamente na política do Storage.
create table private.tabletop_uploads(
 path text primary key, room_code text not null, owner_id uuid not null, uploaded_by uuid not null,
 bytes bigint not null check(bytes>0 and bytes<=52428800), mime text not null,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '15 minutes'
);
create index tabletop_uploads_owner on private.tabletop_uploads(owner_id);
create index tabletop_uploads_room on private.tabletop_uploads(room_code);
alter table private.tabletop_uploads enable row level security;
revoke all on private.tabletop_uploads from public,anon,authenticated,primordios_backend;
create unique index rooms_one_active_owner on private.rooms((document->>'ownerId')) where not (document->>'closed')::boolean;

-- Importar apenas metadados, sem alterar os objetos físicos já existentes.
insert into private.tabletop_uploads(path,room_code,owner_id,uploaded_by,bytes,mime,created_at,expires_at)
 select o.name,split_part(o.name,'/',1),(r.document->>'ownerId')::uuid,(r.document->>'ownerId')::uuid,
 greatest(1,least(52428800,coalesce((o.metadata->>'size')::bigint,52428800))),coalesce(o.metadata->>'mimetype','application/octet-stream'),o.created_at,now()
 from storage.objects o join private.rooms r on r.code=split_part(o.name,'/',1)
 where o.bucket_id='tabletop-assets' on conflict do nothing;

create function private.reserve_tabletop_upload(actor uuid,code text,asset_path text,asset_bytes bigint,asset_mime text)
returns void language plpgsql security definer set search_path='' as $$
declare room_doc jsonb; usage_bytes bigint; usage_count bigint;
begin
 if asset_bytes<1 or asset_bytes>52428800 or asset_path !~ ('^'||code||'/[a-f0-9-]{36}\.[a-z0-9]{1,5}$') then raise exception 'Invalid upload'; end if;
 -- Uma chave global serializa reservas, inclusive quotas do projeto e usuários com várias salas fechadas.
 perform pg_advisory_xact_lock(762942,1);
 select document into room_doc from private.rooms where private.rooms.code=reserve_tabletop_upload.code;
 if room_doc is null or (room_doc->>'closed')::boolean or not exists(select 1 from jsonb_array_elements(room_doc->'members') m where m->>'userId'=actor::text and m->>'role' in ('owner','moderator')) then raise exception 'Unavailable room'; end if;
 select coalesce(sum(bytes),0),count(*) into usage_bytes,usage_count from private.tabletop_uploads where room_code=code;
 if usage_bytes+asset_bytes>262144000 or usage_count>=300 then raise exception 'Room quota'; end if;
 select coalesce(sum(bytes),0),count(*) into usage_bytes,usage_count from private.tabletop_uploads where owner_id=(room_doc->>'ownerId')::uuid;
 if usage_bytes+asset_bytes>524288000 or usage_count>=600 then raise exception 'Owner quota'; end if;
 select coalesce(sum(bytes),0),count(*) into usage_bytes,usage_count from private.tabletop_uploads;
 if usage_bytes+asset_bytes>786432000 or usage_count>=1500 then raise exception 'Project quota'; end if;
 insert into private.tabletop_uploads(path,room_code,owner_id,uploaded_by,bytes,mime)values(asset_path,code,(room_doc->>'ownerId')::uuid,actor,asset_bytes,asset_mime);
end $$;
revoke all on function private.reserve_tabletop_upload(uuid,text,text,bigint,text) from public,anon,authenticated;
grant execute on function private.reserve_tabletop_upload(uuid,text,text,bigint,text) to primordios_backend;

create function private.tabletop_upload_allowed(asset_path text,metadata jsonb)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.tabletop_uploads u where u.path=asset_path and u.uploaded_by=(select auth.uid()) and u.expires_at>now()
 and (metadata->>'size') ~ '^[0-9]+$' and (metadata->>'size')::numeric between 1 and u.bytes
 and metadata->>'mimetype'=u.mime and private.tabletop_role(u.room_code) in ('owner','moderator'))
$$;
revoke all on function private.tabletop_upload_allowed(text,jsonb) from public,anon,authenticated;
grant execute on function private.tabletop_upload_allowed(text,jsonb) to authenticated;
drop policy tabletop_assets_insert on storage.objects;
create policy tabletop_assets_insert on storage.objects for insert to authenticated
 with check(bucket_id='tabletop-assets' and private.tabletop_upload_allowed(name,metadata));

-- Remover conteúdo de fichas excluídas; preservar idempotência sem foto/descrição.
update private.characters set document=jsonb_build_object('id',id::text,'nivel',1) where deleted_at is not null;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create table private.maintenance_auth(id boolean primary key default true check(id),token_hash text not null,next_run timestamptz not null default now());
alter table private.maintenance_auth enable row level security;
revoke all on private.maintenance_auth from public,anon,authenticated,primordios_backend;
do $$ declare token text:=encode(extensions.gen_random_bytes(32),'hex'); begin
 insert into private.maintenance_auth(id,token_hash)values(true,encode(extensions.digest(token,'sha256'),'hex'));
 perform vault.create_secret(token,'primordios_maintenance_token','Token interno de manutenção; nunca enviado ao frontend');
end $$;

create function public.primordios_maintenance(token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare paths jsonb;
begin
 if length(token)<>64 or not exists(select 1 from private.maintenance_auth where token_hash=encode(extensions.digest(token,'sha256'),'hex')) then raise exception 'Unauthorized'; end if;
 -- Evita execuções concorrentes ou disparos repetidos, mesmo com um segredo correto.
 perform pg_advisory_xact_lock(762943,1);
 if not exists(select 1 from private.maintenance_auth where next_run<=now()) then return jsonb_build_object('paths','[]'::jsonb);end if;
 update private.maintenance_auth set next_run=now()+interval '5 minutes';
 delete from private.api_attempts where expires_at<now()-interval '1 day';
 delete from private.characters where deleted_at<now()-interval '30 days';
 update private.rooms set document=jsonb_build_object('code',code,'ownerId',document->>'ownerId','visibility','private','maxPlayers',1,'password',null,'members','[]'::jsonb,'bannedUserIds','[]'::jsonb,'createdAt',document->'createdAt','updatedAt',(extract(epoch from now())*1000)::bigint,'version',(document->>'version')::bigint+1,'closed',true)
 where not (document->>'closed')::boolean and (document->>'updatedAt')::bigint<(extract(epoch from now()-interval '30 days')*1000)::bigint;
 -- Reservas sem objeto podem ser liberadas sem apagar arquivos físicos.
 delete from private.tabletop_uploads u where u.expires_at<now()-interval '1 hour' and not exists(select 1 from storage.objects o where o.bucket_id='tabletop-assets' and o.name=u.path);
 -- Só retornar arquivos de salas fechadas há 24 h; não tocar em mapas ativos.
 select coalesce(jsonb_agg(name),'[]'::jsonb) into paths from (
 select o.name from storage.objects o left join private.rooms r on r.code=split_part(o.name,'/',1)
 where o.bucket_id='tabletop-assets' and o.created_at<now()-interval '24 hours'
 and (r.code is null or ((r.document->>'closed')::boolean and (r.document->>'updatedAt')::bigint<(extract(epoch from now()-interval '24 hours')*1000)::bigint)) limit 100) q;
 delete from private.tabletop_uploads u where not exists(select 1 from storage.objects o where o.bucket_id='tabletop-assets' and o.name=u.path) and u.expires_at<now()-interval '1 hour';
 delete from private.rooms r where (document->>'closed')::boolean and (document->>'updatedAt')::bigint<(extract(epoch from now()-interval '24 hours')*1000)::bigint and not exists(select 1 from storage.objects o where o.bucket_id='tabletop-assets' and split_part(o.name,'/',1)=r.code);
 return jsonb_build_object('paths',paths);
end $$;
revoke all on function public.primordios_maintenance(text) from public,anon,authenticated,primordios_backend;
grant execute on function public.primordios_maintenance(text) to service_role;

select cron.schedule('primordios-cleanup','17 * * * *',$cron$
 select net.http_post(url:='https://afhncjerszypkmiirkkk.supabase.co/functions/v1/maintenance',headers:='{"Content-Type":"application/json"}'::jsonb,
 body:=jsonb_build_object('token',(select decrypted_secret from vault.decrypted_secrets where name='primordios_maintenance_token')),timeout_milliseconds:=30000);
$cron$);
