-- Apply after character slots. Account-wide purchases; no payment card data.
begin;
create table if not exists public.cosmetic_entitlements(user_id uuid references auth.users(id) on delete cascade,sku text not null,source text not null check(source in ('paypal')),created_at timestamptz not null default now(),primary key(user_id,sku));
create table if not exists public.cosmetic_orders(session_id text primary key,user_id uuid not null references auth.users(id),sku text not null,payment_id text not null,amount integer not null check(amount=500),currency text not null check(currency='usd'),created_at timestamptz not null default now());
create table if not exists public.cosmetic_payment_blocks(payment_id text,reason text check(reason in ('refund','dispute')),blocked boolean not null,primary key(payment_id,reason));
alter table public.cosmetic_entitlements enable row level security;
alter table public.cosmetic_orders enable row level security;
alter table public.cosmetic_payment_blocks enable row level security;
revoke all on public.cosmetic_entitlements,public.cosmetic_orders,public.cosmetic_payment_blocks from public,anon,authenticated;
grant all on public.cosmetic_entitlements,public.cosmetic_orders,public.cosmetic_payment_blocks to service_role;
create or replace function public.list_cosmetic_entitlements(p_user_id uuid) returns jsonb language sql set search_path='' as $$select coalesce(jsonb_agg(sku),'[]'::jsonb) from public.cosmetic_entitlements where user_id=p_user_id$$;
create or replace function public.fulfill_cosmetic_order(p_session_id text,p_user_id uuid,p_sku text,p_payment_id text,p_amount integer,p_currency text) returns void language plpgsql set search_path='' as $$begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_payment_id,0));
 insert into public.cosmetic_orders(session_id,user_id,sku,payment_id,amount,currency) values(p_session_id,p_user_id,p_sku,p_payment_id,p_amount,p_currency) on conflict(session_id) do nothing;
 if not exists(select 1 from public.cosmetic_orders where session_id=p_session_id and user_id=p_user_id and sku=p_sku and payment_id=p_payment_id and amount=p_amount and currency=p_currency) then raise exception 'ORDER_MISMATCH';end if;
 if not exists(select 1 from public.cosmetic_payment_blocks where payment_id=p_payment_id and blocked) then insert into public.cosmetic_entitlements(user_id,sku,source) values(p_user_id,p_sku,'paypal') on conflict do nothing;end if;
end$$;
create or replace function public.block_cosmetic_payment(p_payment_id text,p_reason text,p_blocked boolean) returns jsonb language plpgsql set search_path='' as $$begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_payment_id,0));
 insert into public.cosmetic_payment_blocks values(p_payment_id,p_reason,p_blocked) on conflict(payment_id,reason) do update set blocked=excluded.blocked;
 delete from public.cosmetic_entitlements e where source='paypal' and exists(select 1 from public.cosmetic_orders o where o.payment_id=p_payment_id and o.user_id=e.user_id and o.sku=e.sku) and not exists(select 1 from public.cosmetic_orders o where o.user_id=e.user_id and o.sku=e.sku and not exists(select 1 from public.cosmetic_payment_blocks b where b.payment_id=o.payment_id and b.blocked));
 insert into public.cosmetic_entitlements(user_id,sku,source) select distinct user_id,sku,'paypal' from public.cosmetic_orders o where o.payment_id=p_payment_id and not exists(select 1 from public.cosmetic_payment_blocks b where b.payment_id=o.payment_id and b.blocked) on conflict do nothing;
 return(select coalesce(jsonb_agg(distinct user_id),'[]'::jsonb) from public.cosmetic_orders where payment_id=p_payment_id);
end$$;
revoke all on function public.list_cosmetic_entitlements(uuid),public.fulfill_cosmetic_order(text,uuid,text,text,integer,text),public.block_cosmetic_payment(text,text,boolean) from public,anon,authenticated;
grant execute on function public.list_cosmetic_entitlements(uuid),public.fulfill_cosmetic_order(text,uuid,text,text,integer,text),public.block_cosmetic_payment(text,text,boolean) to service_role;
commit;
