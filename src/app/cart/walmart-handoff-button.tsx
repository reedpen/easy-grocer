"use client";

import { useState } from "react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";

type WalmartHandoffButtonProps = {
  cartUrl: string | null;
};

const browser = globalThis as {
  open?: (...args: unknown[]) => void;
};

export function WalmartHandoffButton({ cartUrl }: WalmartHandoffButtonProps) {
  const [toast, setToast] = useState<string | null>(null);

  function handleClick() {
    if (!cartUrl) {
      setToast("Cart URL is not available yet. Try regenerating your weekly plan.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    browser.open?.(cartUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-2">
      <PrimaryActionButton type="button" className="w-full" onClick={handleClick}>
        Send to Walmart cart
      </PrimaryActionButton>
      {toast ? <p className="text-sm text-warning">{toast}</p> : null}
    </div>
  );
}
