import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { hasSupabaseEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (hasSupabaseEnv()) {
    const user = await getCurrentUser();

    if (user) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      redirect(profile ? "/dashboard" : "/onboarding/profile");
    }
  }

  return (
    <AppShell currentPath="/" withNavigation={false}>
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-text-secondary">
          Easy Grocer
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Personalized meal planning and Walmart-ready grocery carts.
        </h1>
        <p className="max-w-2xl text-base text-text-secondary">
          Plan weekly meals around your goals, track calories and macros, and
          hand off groceries to Walmart in one tap.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {["Installable PWA", "Offline fallback", "Walmart cart handoff"].map((item) => (
          <article key={item} className="eg-card p-5 text-sm font-medium text-text-secondary">
            {item}
          </article>
        ))}
      </section>

      <section className="mt-6 flex gap-3">
        <Link href="/login">
          <PrimaryActionButton>Get Started</PrimaryActionButton>
        </Link>
        <Link href="/login">
          <PrimaryActionButton variant="secondary">Sign In</PrimaryActionButton>
        </Link>
      </section>
    </AppShell>
  );
}
