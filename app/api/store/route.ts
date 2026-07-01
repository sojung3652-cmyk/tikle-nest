import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

async function getHouseholdId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const cookieStore = await cookies();
  const preferred = cookieStore.get("tn-household")?.value;

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId);

  const ids = (memberships ?? []).map((m: { household_id: string }) => m.household_id);
  if (ids.length === 0) return null;
  if (preferred && ids.includes(preferred)) return preferred;
  return ids[0];
}

// GET /api/store?k=KEY → {key, value} | null
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null, { status: 401 });

  const k = req.nextUrl.searchParams.get("k");
  if (!k) return NextResponse.json(null, { status: 400 });

  const householdId = await getHouseholdId(supabase, user.id);
  if (!householdId) return NextResponse.json(null, { status: 404 });

  const { data } = await supabase
    .from("app_data")
    .select("value")
    .eq("household_id", householdId)
    .eq("key", k)
    .maybeSingle();

  return NextResponse.json(data ? { key: k, value: data.value } : null);
}

// PUT /api/store  body: {k, v}  → upsert
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { k, v } = await req.json();
  if (!k) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const householdId = await getHouseholdId(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: "No household" }, { status: 404 });

  await supabase.from("app_data").upsert(
    { household_id: householdId, key: k, value: v, updated_at: new Date().toISOString() },
    { onConflict: "household_id,key" }
  );

  return NextResponse.json({ key: k, value: v });
}

// DELETE /api/store?k=KEY
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const k = req.nextUrl.searchParams.get("k");
  if (!k) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const householdId = await getHouseholdId(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: "No household" }, { status: 404 });

  await supabase
    .from("app_data")
    .delete()
    .eq("household_id", householdId)
    .eq("key", k);

  return NextResponse.json({ key: k, deleted: true });
}
