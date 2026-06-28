"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });

  if (error) return { error: error.message };

  // Email confirmation disabled → session is set immediately
  // Email confirmation enabled  → data.session is null
  if (!data.session) {
    return { message: "Check your email to confirm your account, then sign in." };
  }

  redirect("/household");
}

export async function signIn(formData: FormData) {
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;
  const remember = formData.get("remember") === "on";

  const cookieStore = await cookies();

  // When "remember me" is off, strip maxAge so cookies become session-only
  // (deleted when the browser closes). When on, keep Supabase's default maxAge.
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = remember ? options : { ...options, maxAge: undefined };
              cookieStore.set(name, value, opts);
            });
          } catch {}
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
