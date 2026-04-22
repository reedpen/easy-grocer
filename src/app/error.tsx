"use client";

import { useEffect } from "react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6 py-10">
          <section className="eg-card space-y-4 p-6">
            <h1 className="text-xl font-semibold text-danger">Something went wrong</h1>
            <p className="text-sm text-text-secondary">
              Easy Grocer hit an unexpected error. Try again or refresh the page.
            </p>
            <div className="flex gap-3">
              <PrimaryActionButton type="button" onClick={reset}>
                Try again
              </PrimaryActionButton>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
