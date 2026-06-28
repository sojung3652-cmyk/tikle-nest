-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/brpmitewxmtnjfhqnyis/sql

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  currency    text not null default 'USD',
  invite_code text not null unique,
  created_at  timestamptz default now()
);

create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member',
  joined_at    timestamptz default now(),
  primary key (household_id, user_id)
);

create table if not exists accounts (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name         text not null,
  is_private   boolean not null default false,
  owner_id     uuid references auth.users(id),
  created_at   timestamptz default now()
);

create table if not exists budgets (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  month      text not null,   -- "2026-06"
  amount     numeric(15,2) not null default 0
);

create table if not exists goals (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  month      text not null,
  note       text,
  target     numeric(15,2) default 0
);

create table if not exists entries (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references accounts(id) on delete cascade,
  type         text not null check (type in ('expense','income')),
  amount       numeric(15,2) not null,
  note         text,
  category     text,
  date         date not null,
  necessary    boolean default true,
  partial      boolean default false,
  nec_amount   numeric(15,2),
  memo         text,
  has_photo    boolean default false,
  fuel         jsonb,
  is_recurring boolean default false,
  recurring_id uuid,
  created_at   timestamptz default now()
);

create table if not exists recurring (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references accounts(id) on delete cascade,
  name         text not null,
  category     text,
  amount       numeric(15,2) not null,
  necessary    boolean default true,
  billing_day  integer default 1,
  start_month  text,
  end_date     text
);

create table if not exists cars (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references accounts(id) on delete cascade,
  name         text,
  make_model   text,
  year         text,
  fuel_type    text
);

-- app_data: JSON blobs used by the current HTML app (one row per key per household)
create table if not exists app_data (
  household_id uuid not null references households(id) on delete cascade,
  key          text not null,
  value        text not null,
  updated_at   timestamptz default now(),
  primary key (household_id, key)
);

-- ─── Row-Level Security ───────────────────────────────────────────────────────

alter table households       enable row level security;
alter table household_members enable row level security;
alter table accounts          enable row level security;
alter table budgets            enable row level security;
alter table goals              enable row level security;
alter table entries            enable row level security;
alter table recurring          enable row level security;
alter table cars               enable row level security;
alter table app_data           enable row level security;

-- households: visible to members
create policy "members can view household"
  on households for select
  using (id in (select household_id from household_members where user_id = auth.uid()));

create policy "authenticated users can create household"
  on households for insert
  with check (auth.role() = 'authenticated');

-- household_members: each user can only see their own rows (avoids recursive self-join)
create policy "see household members"
  on household_members for select
  using (user_id = auth.uid());

create policy "join a household"
  on household_members for insert
  with check (user_id = auth.uid());

-- app_data: full CRUD for household members
create policy "household members read app_data"
  on app_data for select
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "household members insert app_data"
  on app_data for insert
  with check (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "household members update app_data"
  on app_data for update
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "household members delete app_data"
  on app_data for delete
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

-- accounts: household members can read; private accounts only owner
create policy "view non-private accounts"
  on accounts for select
  using (
    household_id in (select household_id from household_members where user_id = auth.uid())
    and (is_private = false or owner_id = auth.uid())
  );

create policy "household members manage accounts"
  on accounts for all
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

-- entries, budgets, goals, recurring, cars: via account → household
create policy "entries via account"
  on entries for all
  using (account_id in (
    select id from accounts
    where household_id in (select household_id from household_members where user_id = auth.uid())
    and (is_private = false or owner_id = auth.uid())
  ));

create policy "budgets via account"
  on budgets for all
  using (account_id in (
    select id from accounts
    where household_id in (select household_id from household_members where user_id = auth.uid())
  ));

create policy "goals via account"
  on goals for all
  using (account_id in (
    select id from accounts
    where household_id in (select household_id from household_members where user_id = auth.uid())
  ));

create policy "recurring via account"
  on recurring for all
  using (account_id in (
    select id from accounts
    where household_id in (select household_id from household_members where user_id = auth.uid())
  ));

create policy "cars via account"
  on cars for all
  using (account_id in (
    select id from accounts
    where household_id in (select household_id from household_members where user_id = auth.uid())
  ));
