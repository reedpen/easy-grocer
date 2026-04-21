"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const magicLinkSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export type LoginActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const defaultState: LoginActionState = { status: "idle" };

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  return "http://localhost:3000";
}

export async function sendMagicLink(
  previous: LoginActionState = defaultState,
  formData: FormData,
): Promise<LoginActionState> {
  void previous;
  try {
    const parsed = magicLinkSchema.safeParse({
      email: formData.get("email"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid form values.",
      };
    }

    if (!hasSupabaseEnv()) {
      return {
        status: "error",
        message:
          "Supabase is not configured. Add env values before attempting sign-in.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    return {
      status: "success",
      message: "Magic link sent. Check your inbox to continue.",
    };
  } catch {
    return {
      status: "error",
      message: "Could not send magic link. Please try again.",
    };
  }
}

export async function signInWithGoogle() {
  try {
    if (!hasSupabaseEnv()) {
      redirect("/login?error=Supabase%20is%20not%20configured");
    }

    const supabase = await createClient();
    const headerStore = await headers();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      headerStore.get("origin") ??
      "http://localhost:3000";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.url) {
      redirect(data.url);
    }

    redirect("/login?error=Unable%20to%20start%20Google%20sign-in");
  } catch {
    redirect("/login?error=Could%20not%20start%20Google%20sign-in");
  }
}
