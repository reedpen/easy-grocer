import { AppShell } from "@/components/layout/app-shell";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <AppShell withNavigation={false}>
      <section className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">You are offline</h1>
        <p className="text-sm text-text-secondary">
          Easy Grocer could not reach the network. Cached data may still be
          available for your latest dashboard and week plan.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/~offline">
            <PrimaryActionButton variant="secondary">Retry</PrimaryActionButton>
          </Link>
          <Link href="/dashboard">
            <PrimaryActionButton>Go to dashboard</PrimaryActionButton>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
