"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function makeUUID() {
  return crypto.randomUUID();
}

function initialMeta(householdName: string, accountId: string) {
  return JSON.stringify({
    name: householdName,
    currency: "USD",
    accounts: [{ id: accountId, name: "Shared" }],
    currentAccountId: accountId,
    budgets: {},
    goals: {},
    recurring: [],
    recurSkips: {},
    car: {},
  });
}

export async function createHousehold(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const name = (formData.get("name") as string).trim() || "Our Home";
  const currency = (formData.get("currency") as string) || "USD";
  const inviteCode = makeInviteCode();

  const { data: hh, error: hhErr } = await supabase
    .from("households")
    .insert({ name, currency, invite_code: inviteCode })
    .select("id")
    .single();

  if (hhErr) return { error: hhErr.message };

  const ownerDisplayName =
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Owner";

  // Try with display_name (works after migration); fall back without it
  const { error: memberErr } = await supabase
    .from("household_members")
    .insert({ household_id: hh.id, user_id: user.id, role: "owner", display_name: ownerDisplayName });
  if (memberErr) {
    await supabase
      .from("household_members")
      .insert({ household_id: hh.id, user_id: user.id, role: "owner" });
  }

  // Seed the JSON blob store so the HTML app starts with household name + one account
  const accountId = makeUUID();
  await supabase.from("app_data").insert([
    { household_id: hh.id, key: "ledger:meta:v3", value: initialMeta(name, accountId) },
    { household_id: hh.id, key: "ledger:entries:v3", value: "[]" },
  ]);

  redirect("/");
}

export async function joinHousehold(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const code = (formData.get("code") as string).trim().toUpperCase();

  const { data: hh, error } = await supabase
    .from("households")
    .select("id, name")
    .eq("invite_code", code)
    .maybeSingle();

  if (error || !hh) return { error: "Invite code not found. Check the code and try again." };

  // Check not already a member
  const { data: existing } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("household_id", hh.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from("household_members")
      .insert({ household_id: hh.id, user_id: user.id, role: "member" });
  }

  redirect("/");
}
