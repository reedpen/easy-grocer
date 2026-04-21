import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/error-state";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function OnboardingProfilePage() {
  const user = await requireUser();
  let loadError: string | null = null;

  const supabase = await createClient();

  const [{ data: existingProfile, error: profileError }, { data: existingPreferences, error: preferencesError }] =
    await Promise.all([
      supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("dietary_preferences")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (profileError || preferencesError) {
    loadError = "Unable to load profile onboarding right now. Please try again.";
  }

  if (existingProfile) {
    if (existingPreferences) {
      redirect("/dashboard");
    }
    redirect("/onboarding/preferences");
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-6 py-10">
        <ErrorState message={loadError} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-6 py-10">
      <ProfileForm />
    </main>
  );
}
