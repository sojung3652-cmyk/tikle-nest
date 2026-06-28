import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Belt-and-suspenders: explicitly delete every Supabase auth cookie so a
  // stale session can never survive a sign-out, regardless of cookie maxAge.
  const cookieStore = await cookies();
  cookieStore.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-")) cookieStore.delete(name);
  });

  return NextResponse.json({ ok: true });
}
