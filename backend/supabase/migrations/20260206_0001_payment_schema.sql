-- Migration: payment schema
-- Creates tables for Stripe payment integration (customers, subscriptions, invoices, payment_methods, webhook_events)
-- Also adds metadata column to existing notifications table

-- ============================================
-- 1. Customers table (links Supabase users to Stripe)
-- ============================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index idx_customers_user_id on public.customers(user_id);

create trigger on_customers_updated
  before update on public.customers
  for each row execute function public.handle_updated_at();

-- ============================================
-- 2. Subscriptions table
-- ============================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null references public.customers(stripe_customer_id),
  status text not null check (status in ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid', 'paused')),
  price_id text not null,
  quantity integer not null default 1,
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  canceled_at timestamptz,
  ended_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  plan_type text not null check (plan_type in ('monthly', 'yearly')),
  plan_name text not null check (plan_name in ('standard', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);

create trigger on_subscriptions_updated
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- ============================================
-- 3. Invoices table
-- ============================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_invoice_id text unique not null,
  stripe_customer_id text not null references public.customers(stripe_customer_id),
  stripe_subscription_id text references public.subscriptions(stripe_subscription_id),
  amount_due integer not null,        -- in cents
  amount_paid integer not null,       -- in cents
  currency text not null default 'eur',
  status text not null check (status in ('draft', 'open', 'paid', 'uncollectible', 'void')),
  invoice_pdf text,
  hosted_invoice_url text,
  billing_reason text,                -- subscription_create, subscription_cycle, etc.
  created_at timestamptz not null,    -- set from Stripe timestamp, no default
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create index idx_invoices_user_id on public.invoices(user_id);

create trigger on_invoices_updated
  before update on public.invoices
  for each row execute function public.handle_updated_at();

-- ============================================
-- 4. Payment methods table
-- ============================================
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_payment_method_id text unique not null,
  stripe_customer_id text not null references public.customers(stripe_customer_id),
  type text not null,                 -- card, bank_account, etc.
  card_brand text,                    -- visa, mastercard, etc.
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_payment_methods_updated
  before update on public.payment_methods
  for each row execute function public.handle_updated_at();

-- ============================================
-- 5. Webhook events table (audit trail)
-- ============================================
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  type text not null,
  data jsonb not null,
  processed boolean not null default false,
  processing_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index idx_webhook_events_processed on public.webhook_events(processed);

-- ============================================
-- 6. Add metadata column to existing notifications table
-- ============================================
alter table public.notifications add column if not exists metadata jsonb;

-- ============================================
-- 7. RLS policies
-- ============================================

-- Customers: users can only read their own
alter table public.customers enable row level security;

create policy "Users can view own customer data"
  on public.customers for select
  using (auth.uid() = user_id);

-- Subscriptions: users can only read their own
alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Invoices: users can only read their own
alter table public.invoices enable row level security;

create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

-- Payment methods: users can only read their own
alter table public.payment_methods enable row level security;

create policy "Users can view own payment methods"
  on public.payment_methods for select
  using (auth.uid() = user_id);

-- Webhook events: no user access (service_role only)
alter table public.webhook_events enable row level security;
