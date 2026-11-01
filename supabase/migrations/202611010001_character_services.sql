-- Paid one-use character services. Run after cosmetic_shop.sql.
begin;
alter table public.cosmetic_orders drop constraint if exists cosmetic_orders_amount_check;
alter table public.cosmetic_orders add constraint cosmetic_orders_amount_check check
 ((sku in ('token:sex-change','token:stat-reset','token:class-change') and amount=750)
 or (sku not like 'token:%' and amount=500));
create unique index if not exists cosmetic_orders_payment_unique on public.cosmetic_orders(payment_id);
create table if not exists public.character_service_uses (
 order_id text primary key references public.cosmetic_orders(session_id),
 user_id uuid not null references auth.users(id),slot integer not null check(slot between 1 and 4),
 used_at timestamptz not null default now()
);
alter table public.character_service_uses enable row level security;
revoke all on public.character_service_uses from public,anon,authenticated;
grant all on public.character_service_uses to service_role;
create or replace function public.fulfill_cosmetic_order(p_session_id text,p_user_id uuid,p_sku text,p_payment_id text,p_amount integer,p_currency text) returns void language plpgsql set search_path='' as $$begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_payment_id,0));
 insert into public.cosmetic_orders(session_id,user_id,sku,payment_id,amount,currency) values(p_session_id,p_user_id,p_sku,p_payment_id,p_amount,p_currency) on conflict(session_id) do nothing;
 if not exists(select 1 from public.cosmetic_orders where session_id=p_session_id and user_id=p_user_id and sku=p_sku and payment_id=p_payment_id and amount=p_amount and currency=p_currency) then raise exception 'ORDER_MISMATCH';end if;
 if p_sku not like 'token:%' and not exists(select 1 from public.cosmetic_payment_blocks where payment_id=p_payment_id and blocked) then insert into public.cosmetic_entitlements(user_id,sku,source) values(p_user_id,p_sku,'paypal') on conflict do nothing;end if;
end$$;
create or replace function public.block_cosmetic_payment(p_payment_id text,p_reason text,p_blocked boolean) returns jsonb language plpgsql set search_path='' as $$begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_payment_id,0));
 insert into public.cosmetic_payment_blocks values(p_payment_id,p_reason,p_blocked) on conflict(payment_id,reason) do update set blocked=excluded.blocked;
 delete from public.cosmetic_entitlements e where source='paypal' and exists(select 1 from public.cosmetic_orders o where o.payment_id=p_payment_id and o.user_id=e.user_id and o.sku=e.sku) and not exists(select 1 from public.cosmetic_orders o where o.user_id=e.user_id and o.sku=e.sku and not exists(select 1 from public.cosmetic_payment_blocks b where b.payment_id=o.payment_id and b.blocked));
 insert into public.cosmetic_entitlements(user_id,sku,source) select distinct user_id,sku,'paypal' from public.cosmetic_orders o where o.sku not like 'token:%' and o.payment_id=p_payment_id and not exists(select 1 from public.cosmetic_payment_blocks b where b.payment_id=o.payment_id and b.blocked) on conflict do nothing;
 return(select coalesce(jsonb_agg(distinct user_id),'[]'::jsonb) from public.cosmetic_orders where payment_id=p_payment_id);
end$$;
create or replace function public.list_service_tokens(p_user_id uuid) returns jsonb language sql set search_path='' as $$
 select coalesce(jsonb_object_agg(sku,n),'{}'::jsonb) from (
 select o.sku,count(*) n from public.cosmetic_orders o
 where o.user_id=p_user_id and o.sku in ('token:sex-change','token:stat-reset','token:class-change')
 and not exists(select 1 from public.character_service_uses u where u.order_id=o.session_id)
 and not exists(select 1 from public.cosmetic_payment_blocks b where b.payment_id=o.payment_id and b.blocked)
 group by o.sku) available;
$$;
create or replace function public.use_character_service(p_user_id uuid,p_session_id uuid,p_slot integer,p_sku text,p_progress jsonb)
returns timestamptz language plpgsql set search_path='' as $$
declare token public.cosmetic_orders; saved timestamptz;
begin
 if p_sku not in ('token:sex-change','token:stat-reset','token:class-change') then raise exception 'INVALID_TOKEN';end if;
 -- Serialize account-wide consumption across all four characters.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,1));
 perform 1 from public.character_saves where user_id=p_user_id and slot=p_slot
 and active_session=p_session_id and lease_expires>pg_catalog.now() for update;
 if not found then raise exception 'SAVE_SESSION_EXPIRED';end if;
 select o.* into token from public.cosmetic_orders o where o.user_id=p_user_id and o.sku=p_sku
 and not exists(select 1 from public.character_service_uses u where u.order_id=o.session_id)
 and not exists(select 1 from public.cosmetic_payment_blocks b where b.payment_id=o.payment_id and b.blocked)
 order by o.created_at,o.session_id limit 1 for update;
 if not found then raise exception 'NO_SERVICE_TOKEN';end if;
 -- Share the payment lock with refund/dispute handlers and recheck after waiting.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(token.payment_id,0));
 if exists(select 1 from public.cosmetic_payment_blocks where payment_id=token.payment_id and blocked) then raise exception 'NO_SERVICE_TOKEN';end if;
 insert into public.character_service_uses(order_id,user_id,slot) values(token.session_id,p_user_id,p_slot);
 update public.character_saves set progress=p_progress,lease_expires=pg_catalog.now()+interval '60 seconds'
 where user_id=p_user_id and slot=p_slot returning updated_at into saved;
 return saved;
end$$;
revoke all on function public.list_service_tokens(uuid),public.use_character_service(uuid,uuid,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.list_service_tokens(uuid),public.use_character_service(uuid,uuid,integer,text,jsonb) to service_role;
commit;
