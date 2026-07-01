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

  // Check household membership only for the two routes that need it.
  // Use limit(1) instead of maybeSingle() so it never errors when a user
  // belongs to multiple households.
  if (pathname === "/" || pathname === "/household") {
    const { data: memberships } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .limit(1);

    const hasMembership = memberships && memberships.length > 0;

    // Main app: require a household
    if (pathname === "/" && !hasMembership) {
      return NextResponse.redirect(new URL("/household", request.url));
    }

    // Create/join page: users who already have a household go straight to the app
    if (pathname === "/household" && hasMembership) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/household", "/signin", "/signup"],
};
