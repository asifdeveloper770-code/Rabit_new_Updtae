-- Payment gateway configuration, managed from the Admin Panel.
-- Secrets (api_key_encrypted, webhook_secret_encrypted) are AES-256-GCM
-- ciphertext produced by the Edge Functions using PAYMENT_ENCRYPTION_KEY.
-- This table is never queried directly from the browser: RLS denies all
-- access to the anon/authenticated roles, so it is reachable only through
-- the service-role key used inside the admin-btcpay-settings,
-- admin-btcpay-test-connection, create-btcpay-invoice, and btcpay-webhook
-- Edge Functions.

create table if not exists public.payment_gateways (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  enabled boolean not null default false,
  server_url text,
  store_id text,
  api_key_encrypted text,
  webhook_secret_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_gateways enable row level security;

-- No policies are created for anon/authenticated: default-deny.
-- Only the service_role key (used server-side in Edge Functions) can
-- read or write this table.

drop trigger if exists set_payment_gateways_updated_at on public.payment_gateways;

create or replace function public.set_payment_gateways_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_payment_gateways_updated_at
before update on public.payment_gateways
for each row
execute function public.set_payment_gateways_updated_at();
