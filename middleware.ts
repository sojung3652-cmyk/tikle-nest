import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/signin" || pathname === "/signup";

  // Redirect signed-in users away from auth pages
  if (isAuthPage) {
    if (user) return NextResponse.redirect(new URL("/", request.url));
    return response;
  }

  // Require auth for everything else
  if (!user) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Main app requires a household
  if (pathname === "/") {
    const { data } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      return NextResponse.redirect(new URL("/household", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/household", "/signin", "/signup"],
};
