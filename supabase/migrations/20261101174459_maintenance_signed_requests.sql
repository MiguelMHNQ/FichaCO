-- Correção da autenticação e do WHERE exigido pelo safeupdate. Regras de retenção já autorizadas permanecem idênticas.
select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'primordios_maintenance_hmac','Segredo de assinatura da manutenção; somente Vault');
create or replace function public.primordios_maintenance(token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare paths jsonb;
begin
 if token !~ '^[0-9]{10}\.[a-f0-9]{64}$' then raise exception 'Unauthorized'; end if;
 if abs(extract(epoch from now())-split_part(token,'.',1)::bigint)>120 then raise exception 'Unauthorized';end if;
 if split_part(token,'.',2) is distinct from (select encode(extensions.hmac(split_part(token,'.',1),decrypted_secret,'sha256'),'hex') from vault.decrypted_secrets where name='primordios_maintenance_hmac') then raise exception 'Unauthorized';end if;
 -- Evita execuções concorrentes ou disparos repetidos, mesmo com um segredo correto.
 perform pg_advisory_xact_lock(762943,1);
 if not exists(select 1 from private.maintenance_auth where next_run<=now()) then return jsonb_build_object('paths','[]'::jsonb);end if;
 update private.maintenance_auth set next_run=now()+interval '5 minutes' where id=true;
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
select cron.unschedule('primordios-cleanup');
select cron.schedule('primordios-cleanup','17 * * * *',$cron$
 with signature as(select floor(extract(epoch from now()))::bigint::text as stamp),signed as(select stamp||'.'||encode(extensions.hmac(stamp,(select decrypted_secret from vault.decrypted_secrets where name='primordios_maintenance_hmac'),'sha256'),'hex') as token from signature)
 select net.http_post(url:='https://afhncjerszypkmiirkkk.supabase.co/functions/v1/maintenance',headers:='{"Content-Type":"application/json"}'::jsonb,body:=(select jsonb_build_object('token',token) from signed),timeout_milliseconds:=30000);
$cron$);
