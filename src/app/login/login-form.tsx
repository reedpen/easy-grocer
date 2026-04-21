"use client";

import { useActionState } from "react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import type { LoginActionState } from "./actions";
import { sendMagicLink, signInWithGoogle } from "./actions";

const initialState: LoginActionState = { status: "idle" };

export function LoginForm() {
  const [state, action, isPending] = useActionState(sendMagicLink, initialState);

  return (
    <div className="eg-card w-full max-w-md space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Sign in to Easy Grocer</h1>
        <p className="text-sm text-text-secondary">
          Use magic link email login or continue with Google.
        </p>
      </div>

      <form action={action} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-focus-ring"
        />
        <PrimaryActionButton type="submit" disabled={isPending} className="w-full">
          {isPending ? "Sending..." : "Send magic link"}
        </PrimaryActionButton>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-2 text-text-secondary">
            Or continue with
          </span>
        </div>
      </div>

      <form action={signInWithGoogle}>
        <PrimaryActionButton type="submit" variant="secondary" className="w-full">
          Google
        </PrimaryActionButton>
      </form>

      {state.status !== "idle" && state.message ? (
        <p
          className={`text-sm ${
            state.status === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
