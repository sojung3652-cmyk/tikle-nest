import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// GET /api/household/all-accounts
// Returns every household the user belongs to, each with its accounts
// parsed from app_data. Used by the account-selection overlay to show
// a grouped view across multiple households.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const cookieStore = await cookies();
  const preferred = cookieStore.get("tn-household")?.value;

  // All memberships for this user
  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id, role, display_name")
    .eq("user_id", user.id);

  if (!memberships?.length) return NextResponse.json([]);

  const ids = memberships.map((m: { household_id: string }) => m.household_id);
  const resolvedActive = (preferred && ids.includes(preferred)) ? preferred : ids[0];

  // Household names
  const { data: hhRows } = await supabase
    .from("households")
    .select("id, name")
    .in("id", ids);

  const hhName: Record<string, string> = {};
  for (const h of hhRows ?? []) hhName[h.id] = h.name;

  // Meta blobs (accounts live inside these)
  const { data: metaRows } = await supabase
    .from("app_data")
    .select("household_id, value")
    .in("household_id", ids)
    .eq("key", "ledger:meta:v3");

  const metaMap: Record<string, { accounts?: { id: string; name: string; currency?: string; lock?: number | string }[] }> = {};
  for (const row of metaRows ?? []) {
    try { metaMap[row.household_id] = JSON.parse(row.value); } catch {}
  }

  // For households where this user is a member (not owner), look up the
  // owner's display_name so the UI can show "Joined · <owner name>".
  // This only works after the RLS migration has been applied.
  const memberHhIds = memberships
    .filter((m: { role: string }) => m.role !== "owner")
    .map((m: { household_id: string }) => m.household_id);

  const ownerNames: Record<string, string | null> = {};
  if (memberHhIds.length > 0) {
    const { data: ownerRows } = await supabase
      .from("household_members")
      .select("household_id, display_name")
      .in("household_id", memberHhIds)
      .eq("role", "owner");

    for (const row of ownerRows ?? []) {
      ownerNames[row.household_id] = row.display_name || null;
    }
  }

  const results = memberships.map((m: { household_id: string; role: string; display_name?: string }) => {
    const parsed = metaMap[m.household_id];
    const accounts = (parsed?.accounts ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency || "USD",
      lock: !!(a.lock),
    }));
    return {
      id: m.household_id,
      name: hhName[m.household_id] || "Household",
      role: m.role,
      isActive: m.household_id === resolvedActive,
      ownerName: m.role !== "owner" ? (ownerNames[m.household_id] ?? null) : null,
      accounts,
    };
  });

  // Active household first
  results.sort((a: { isActive: boolean }, b: { isActive: boolean }) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));

  return NextResponse.json(results);
}
