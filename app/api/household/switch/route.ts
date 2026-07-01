import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { householdId } = await req.json();
  if (!householdId) return NextResponse.json({ error: "householdId required" }, { status: 400 });

  // Verify caller is actually a member of the requested household
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) return NextResponse.json({ error: "Not a member of that household" }, { status: 403 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("tn-household", householdId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });
  return res;
}
