-- Run after the existing housing and character-slot migrations.
-- Adds ten lower-village homes without changing existing owners or displays.
begin;
insert into public.player_houses(id,price,layout_version) values
 ('groundwest1',500,2),('groundwest2',750,2),('groundwest3',600,2),('groundwest4',1000,2),('groundwest5',850,2),
 ('groundeast1',500,2),('groundeast2',750,2),('groundeast3',600,2),('groundeast4',1000,2),('groundeast5',850,2)
on conflict(id) do nothing;
commit;
