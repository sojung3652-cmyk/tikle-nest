import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

async function getActiveHouseholdId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const cookieStore = await cookies();
  const preferred = cookieStore.get("tn-household")?.value;

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId);

  const ids = (memberships ?? []).map((m: { household_id: string }) => m.household_id);
  if (!ids.length) return null;
  return (preferred && ids.includes(preferred)) ? preferred : ids[0];
}

// GET /api/household/members — list all members of the active household
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const householdId = await getActiveHouseholdId(supabase, user.id);
  if (!householdId) return NextResponse.json([]);

  const { data: members } = await supabase
    .from("household_members")
    .select("user_id, role, display_name, joined_at")
    .eq("household_id", householdId)
    .order("joined_at", { ascending: true });

  return NextResponse.json(members ?? []);
}

// DELETE /api/household/members  body: { userId }
// Owners can remove other members from their household.
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (targetUserId === user.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

  const householdId = await getActiveHouseholdId(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: "No household" }, { status: 404 });

  // Verify caller is the owner (also enforced by RLS delete policy)
  const { data: callerRow } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (callerRow?.role !== "owner") {
    return NextResponse.json({ error: "Only the household owner can remove members" }, { status: 403 });
  }

  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("household_id", householdId)
    .eq("user_id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
