import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) return NextResponse.json({ error: "No household" }, { status: 404 });

  const { data: hh } = await supabase
    .from("households")
    .select("name, invite_code")
    .eq("id", member.household_id)
    .single();

  return NextResponse.json(hh ?? { error: "Not found" });
}
