# Tikle Nest — Build Guide

## What this is
Tikle Nest is a shared household budgeting app for a couple (one earner, one manages the budget). It tracks spending as "Necessary" vs "Could save," has multiple accounts (shared + private with password lock), fuel tracking with MPG, receipt scanning with AI, and spending analysis.

The file `household-ledger.html` is the fully working prototype with every feature built. Use it as the reference for building the real app.

## Tech stack

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | Next.js (React) | The prototype's UI translates directly to React components |
| Database | Supabase (PostgreSQL) | Free tier, gives you auth + database + real-time |
| Auth | Supabase Auth | Real login (replaces the PIN lock) |
| AI features | Anthropic API via server route | Receipt scanning, spending analysis, fuel advice |
| Hosting | Vercel | Free, deploys from GitHub automatically |
| Styling | CSS Modules or Tailwind | Keep the same design tokens from the prototype |

## Database tables

```sql
-- Households (replaces meta.name)
households (
  id uuid primary key,
  name text,
  currency text default 'USD',
  created_at timestamp
)

-- Accounts (replaces meta.accounts)
accounts (
  id uuid primary key,
  household_id uuid references households,
  name text,
  is_private boolean default false,
  owner_id uuid references auth.users,
  created_at timestamp
)

-- Budgets (replaces meta.budgets)
budgets (
  id uuid primary key,
  account_id uuid references accounts,
  month text, -- "2026-06"
  amount decimal
)

-- Goals (replaces meta.goals)
goals (
  id uuid primary key,
  account_id uuid references accounts,
  month text,
  note text,
  target decimal
)

-- Entries (replaces entries array)
entries (
  id uuid primary key,
  account_id uuid references accounts,
  type text, -- 'expense' or 'income'
  amount decimal,
  note text,
  category text,
  date date,
  necessary boolean,
  partial boolean default false,
  nec_amount decimal,
  memo text,
  has_photo boolean default false,
  fuel jsonb, -- {unit, price, distance}
  is_recurring boolean default false,
  recurring_id uuid,
  created_at timestamp
)

-- Recurring items (replaces meta.recurring)
recurring (
  id uuid primary key,
  account_id uuid references accounts,
  name text,
  category text,
  amount decimal,
  necessary boolean,
  billing_day integer,
  start_month text,
  end_date text
)

-- Car info (replaces meta.car)
cars (
  id uuid primary key,
  account_id uuid references accounts,
  name text,
  make_model text,
  year text,
  fuel_type text
)

-- Receipt photos stored in Supabase Storage (not the database)
```

## Features list (all built in prototype)

1. Multiple accounts with pill switcher
2. Private accounts with password/auth lock
3. Currency picker with conversion
4. Budget setting per account per month
5. Monthly goal with progress
6. Income tracking (modal)
7. Add expense: amount, note, category, date, necessary/could-save/partial, memo, receipt
8. Receipt upload with AI auto-scan (fills fields automatically)
9. Edit entry (with receipt add/replace/remove, delete)
10. Fuel tracking: gallons default, price per gallon, miles driven, computed MPG
11. Fuel view: car details (searchable make/model), by-month/all-time, efficiency chart, AI fuel advice
12. Recurring/subscriptions: auto-materialize monthly entries
13. Entry list: toggle open/close, sort (newest/oldest/high-low/low-high), filter (necessary/could-save), category multi-select, 5-row limit with "See all"
14. Spending breakdown by category (bar chart)
15. AI spending analysis
16. Month picker (tappable calendar grid)
17. Onboarding flow
18. Color theme: Blush and Stone (with plan to add user color choice)

## Categories
Rent/Housing, Utilities, Groceries, Public transit, Fuel/Gas, Car payment/upkeep, Taxi/Rideshare, Phone/Internet, Health, Insurance, Dining out, Shopping, Entertainment, Subscriptions, Gifts, Other

## Design tokens (current palette: Blush and Stone)
```css
--paper: #FAF7F7    /* page background */
--card: #FFFFFF     /* card background */
--ink: #3D3436      /* primary text */
--ink-soft: #7A6E70 /* secondary text */
--ink-faint: #A89DA0 /* muted text */
--mist: #E2DCDD     /* borders */
--mist-2: #EEEBEB   /* subtle borders */
--nec: #8E7E80      /* necessary indicator (stone) */
--nec-soft: #E8E0E2
--nec-text: #5C4E50
--save: #D08080     /* could-save indicator (blush-pink) */
--save-soft: #F5E0E0
--save-text: #984848
--accent: #C87878   /* buttons, interactive elements (blush) */
--accent-soft: #F2DEDE
--accent-text: #8C4444
--over: #D94452     /* over budget (red) */
--positive: #6B9E8A /* income (muted green) */
```

## Logo
Mountain (태산) outline in stone + amber dot (티끌) at base.
From the Korean proverb 티끌 모아 태산 — small dust gathered makes a mountain.

## Step-by-step build order

### Phase 1 — Scaffold
1. Create Next.js project
2. Set up Supabase project (database + auth)
3. Create database tables
4. Set up environment variables (Supabase URL/key, Anthropic API key)
5. Create the layout and design tokens (CSS variables)

### Phase 2 — Core
6. Build onboarding flow (create household, first account, pick currency)
7. Build account switcher (pills) with Supabase auth for private accounts
8. Build budget hero section (budget amount, bar chart, stats strip)
9. Build add-entry form (all fields including receipt upload)
10. Build entry list with sort/filter/category controls

### Phase 3 — Features
11. Build income modal
12. Build recurring/subscriptions
13. Build fuel view (car details, fuel log, efficiency chart)
14. Build spending breakdown
15. Build month picker

### Phase 4 — AI
16. Create API route for Anthropic calls (server-side, keeps key safe)
17. Wire up receipt scanning (upload → API route → auto-fill)
18. Wire up spending analysis
19. Wire up fuel advice
20. Wire up necessity recommendation

### Phase 5 — Polish
21. Add color theme picker (user can choose their palette)
22. Mobile responsive tweaks
23. Deploy to Vercel
