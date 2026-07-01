-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/brpmitewxmtnjfhqnyis/sql

-- 1. Store each member's display name so co-members can show it
alter table household_members
  add column if not exists display_name text;

-- 2. Replace the old "see own rows only" policy with one that lets
--    all members of a household see each other
drop policy if exists "see household members" on household_members;

create policy "household members can see co-members"
  on household_members for select
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- 3. Allow owners to remove other members
create policy if not exists "owners can remove members"
  on household_members for delete
  using (
    -- caller must be an owner of this household
    household_id in (
      select household_id from household_members
      where user_id = auth.uid() and role = 'owner'
    )
    -- owners cannot delete themselves via this policy
    and user_id != auth.uid()
  );
