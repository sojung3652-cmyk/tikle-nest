import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const { data: hh } = await supabase
    .from("households")
    .select("id, name")
    .eq("invite_code", String(code).trim().toUpperCase())
    .maybeSingle();

  if (!hh) return NextResponse.json({ error: "Invite code not found. Check the code and try again." }, { status: 404 });

  const { data: existing } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("household_id", hh.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const memberDisplayName =
      (user.user_metadata?.display_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Member";
    // Try with display_name (works after migration); fall back without it
    let { error } = await supabase
      .from("household_members")
      .insert({ household_id: hh.id, user_id: user.id, role: "member", display_name: memberDisplayName });
    if (error) {
      const retry = await supabase
        .from("household_members")
        .insert({ household_id: hh.id, user_id: user.id, role: "member" });
      error = retry.error;
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: hh.id, name: hh.name, alreadyMember: !!existing });
}
