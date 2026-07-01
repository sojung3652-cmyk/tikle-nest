import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// GET /api/store/keys?p=PREFIX → {keys: [...]}
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ keys: [] }, { status: 401 });

  const cookieStore = await cookies();
  const preferred = cookieStore.get("tn-household")?.value;

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id);

  const ids = (memberships ?? []).map((m: { household_id: string }) => m.household_id);
  if (ids.length === 0) return NextResponse.json({ keys: [] });
  const householdId = (preferred && ids.includes(preferred)) ? preferred : ids[0];

  const prefix = req.nextUrl.searchParams.get("p") || "";

  let query = supabase
    .from("app_data")
    .select("key")
    .eq("household_id", householdId);

  if (prefix) query = query.like("key", `${prefix}%`);

  const { data } = await query;
  return NextResponse.json({ keys: (data ?? []).map((r: { key: string }) => r.key) });
}
