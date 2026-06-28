import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/store/keys?p=PREFIX → {keys: [...]}
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ keys: [] }, { status: 401 });

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) return NextResponse.json({ keys: [] });

  const prefix = req.nextUrl.searchParams.get("p") || "";

  let query = supabase
    .from("app_data")
    .select("key")
    .eq("household_id", member.household_id);

  if (prefix) query = query.like("key", `${prefix}%`);

  const { data } = await query;
  return NextResponse.json({ keys: (data ?? []).map((r: { key: string }) => r.key) });
}
