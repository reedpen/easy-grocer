import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function sanitizeNextPath(candidate: string | null) {
  if (!candidate) return "/dashboard";
  if (!candidate.startsWith("/")) return "/dashboard";
  if (candidate.startsWith("//")) return "/dashboard";
  return candidate;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(
      new URL("/login?error=Supabase%20is%20not%20configured", requestUrl.origin),
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        code,
      );
      if (exchangeError) {
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent(exchangeError.message)}`,
            requestUrl.origin,
          ),
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profile) {
          return NextResponse.redirect(
            new URL("/onboarding/profile", requestUrl.origin),
          );
        }
      }
    } catch {
      return NextResponse.redirect(
        new URL("/login?error=Authentication%20callback%20failed", requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
