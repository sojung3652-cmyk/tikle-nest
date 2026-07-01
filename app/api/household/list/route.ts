import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const cookieStore = await cookies();
  const activeId = cookieStore.get("tn-household")?.value;

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id);

  if (!memberships?.length) return NextResponse.json([]);

  const ids = memberships.map((m: { household_id: string; role: string }) => m.household_id);
  const { data: households } = await supabase
    .from("households")
    .select("id, name")
    .in("id", ids);

  const roleMap = Object.fromEntries(
    memberships.map((m: { household_id: string; role: string }) => [m.household_id, m.role])
  );

  // First membership id is the fallback active household
  const fallback = ids[0];
  const resolvedActive = (activeId && ids.includes(activeId)) ? activeId : fallback;

  const result = (households ?? []).map((hh: { id: string; name: string }) => ({
    id: hh.id,
    name: hh.name,
    role: roleMap[hh.id],
    isActive: hh.id === resolvedActive,
  }));

  return NextResponse.json(result);
}
