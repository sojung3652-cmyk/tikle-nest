import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// GET /api/household/all-accounts
// Returns every household the user belongs to, each with its accounts
// parsed from app_data. Implements the join:
//   SELECT h.* FROM households h
//   JOIN household_members hm ON hm.household_id = h.id
//   WHERE hm.user_id = [current user]
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const cookieStore = await cookies();
  const preferred = cookieStore.get("tn-household")?.value;

  // Single JOIN query — equivalent to the SQL above. Using !inner ensures
  // only households where the user actually has a membership row are returned.
  const { data: memberships, error: membershipsErr } = await supabase
    .from("household_members")
    .select("household_id, role, households!inner(id, name)")
    .eq("user_id", user.id);

  if (membershipsErr || !memberships?.length) return NextResponse.json([]);

  type MemberRow = {
    household_id: string;
    role: string;
    households: { id: string; name: string };
  };
  const rows = memberships as unknown as MemberRow[];

  const ids = rows.map((m) => m.household_id);
  const resolvedActive = (preferred && ids.includes(preferred)) ? preferred : ids[0];

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

  // For member households, optionally look up owner display names (post-migration only)
  const memberHhIds = rows
    .filter((m) => m.role !== "owner")
    .map((m) => m.household_id);

  const ownerNames: Record<string, string | null> = {};
  if (memberHhIds.length > 0) {
    const { data: ownerRows, error: ownerErr } = await supabase
      .from("household_members")
      .select("household_id, display_name")
      .in("household_id", memberHhIds)
      .eq("role", "owner");

    if (!ownerErr) {
      for (const row of ownerRows ?? []) {
        ownerNames[row.household_id] = (row as { household_id: string; display_name?: string }).display_name || null;
      }
    }
  }

  const results = rows.map((m) => {
    const parsed = metaMap[m.household_id];
    const accounts = (parsed?.accounts ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency || "USD",
      lock: !!(a.lock),
    }));
    return {
      id: m.household_id,
      name: m.households.name || "Household",
      role: m.role,
      isActive: m.household_id === resolvedActive,
      ownerName: m.role !== "owner" ? (ownerNames[m.household_id] ?? null) : null,
      accounts,
    };
  });

  // Owner households first, then member. Within same role, active first.
  results.sort((a, b) => {
    if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
    return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
  });
  return NextResponse.json(results);
}
