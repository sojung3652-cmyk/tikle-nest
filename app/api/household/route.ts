import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = await cookies();
  const preferred = cookieStore.get("tn-household")?.value;

  // Fetch all memberships; do not use maybeSingle() which errors on multiple rows
  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id);

  const ids = (memberships ?? []).map((m: { household_id: string }) => m.household_id);
  if (ids.length === 0) return NextResponse.json({ error: "No household" }, { status: 404 });

  const householdId = (preferred && ids.includes(preferred)) ? preferred : ids[0];

  const { data: hh } = await supabase
    .from("households")
    .select("name, invite_code")
    .eq("id", householdId)
    .single();

  return NextResponse.json(hh ?? { error: "Not found" });
}
