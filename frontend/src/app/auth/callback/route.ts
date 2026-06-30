import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      const cookieStore = await cookies();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[Auth Callback] Code exchange failed:", error.message);
        return NextResponse.redirect(
          new URL("/login?error=exchange_failed", request.url)
        );
      }
    } catch (err) {
      console.error("[Auth Callback] Exception during code exchange:", err);
      return NextResponse.redirect(
        new URL("/login?error=callback_exception", request.url)
      );
    }
  }

  // Redirect to dashboard on success
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
