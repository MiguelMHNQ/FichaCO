revoke all on net.http_request_queue, net._http_response from public,anon,authenticated;
revoke execute on all functions in schema net from public,anon,authenticated;
create policy tabletop_uploads_deny_direct on private.tabletop_uploads for all to public using(false) with check(false);
create policy maintenance_auth_deny_direct on private.maintenance_auth for all to public using(false) with check(false);
