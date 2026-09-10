-- Draft schema matching the current AgroFlow front model.
-- Do not run as a destructive migrate on a live project.

create extension if not exists "pgcrypto";

create type public.auth_role as enum ('producteur', 'transporteur', 'operateur');
create type public.product_category as enum (
  'cereales', 'fruits', 'legumes', 'tubercules', 'oleagineux', 'elevage'
);
create type public.lot_status as enum ('enregistre', 'regroupe', 'en_transport', 'livre');
create type public.operation_status as enum ('planifiee', 'en_cours', 'livree');
create type public.vigilance as enum ('ok', 'vigilance', 'alerte');
create type public.event_type as enum (
  'creation', 'regroupement', 'depart', 'controle', 'retard', 'incident', 'livraison'
);
create type public.constraint_kind as enum ('perissable', 'refrigere', 'fragile', 'sec');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.auth_role not null,
  email text unique,
  display_name text not null,
  org text not null,
  created_at timestamptz not null default now()
);

create table public.operations (
  id text primary key,
  corridor text not null,
  carrier text not null default '',
  vehicle_capacity_kg integer not null check (vehicle_capacity_kg > 0),
  status public.operation_status not null default 'planifiee',
  created_at timestamptz not null default now()
);

create table public.lots (
  id text primary key,
  producer text not null,
  product text not null,
  category public.product_category not null,
  quantity_kg integer not null check (quantity_kg > 0),
  origin_name text not null,
  origin_x numeric not null,
  origin_y numeric not null,
  destination_name text not null,
  destination_x numeric not null,
  destination_y numeric not null,
  available_from date not null,
  available_to date not null,
  constraints public.constraint_kind[] not null default '{}',
  status public.lot_status not null default 'enregistre',
  operation_id text references public.operations (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.operation_lots (
  operation_id text not null references public.operations (id) on delete cascade,
  lot_id text not null references public.lots (id) on delete cascade,
  primary key (operation_id, lot_id)
);

create table public.lot_events (
  id text primary key,
  lot_id text not null references public.lots (id) on delete cascade,
  type public.event_type not null,
  at timestamptz not null default now(),
  note text not null default '',
  vigilance public.vigilance not null default 'ok'
);

create index lot_events_lot_id_at_idx on public.lot_events (lot_id, at);

create view public.passports as
select
  l.*,
  coalesce(
    (
      select jsonb_agg(e order by e.at)
      from public.lot_events e
      where e.lot_id = l.id
    ),
    '[]'::jsonb
  ) as events
from public.lots l;

create table public.transport_payments (
  id text primary key,
  operation_id text not null references public.operations (id) on delete cascade,
  payer_org text not null,
  amount_fcfa integer not null check (amount_fcfa > 0),
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  provider text not null,
  transaction_id text,
  created_at timestamptz not null default now()
);

-- RLS placeholders — tighten per role before any production use.
alter table public.profiles enable row level security;
alter table public.lots enable row level security;
alter table public.operations enable row level security;
alter table public.operation_lots enable row level security;
alter table public.lot_events enable row level security;
alter table public.transport_payments enable row level security;
