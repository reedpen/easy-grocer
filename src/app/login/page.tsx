import { requireAnonymous } from "@/lib/auth/guards";
import { hasSupabaseEnv } from "@/lib/env";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await requireAnonymous();
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
      <div className="w-full space-y-4">
        {!hasSupabaseEnv() ? (
          <p className="text-center text-sm text-amber-600">
            Supabase env values are missing. Set `.env.local` before login.
          </p>
        ) : null}
        <LoginForm />
        {params.error ? (
          <p className="text-center text-sm text-red-600">{params.error}</p>
        ) : null}
      </div>
    </main>
  );
}
