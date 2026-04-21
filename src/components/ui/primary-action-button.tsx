import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type PrimaryActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-95",
  secondary: "border border-border bg-surface hover:bg-surface-strong",
  ghost: "hover:bg-surface-strong",
  danger: "bg-danger text-primary-foreground hover:brightness-95",
};

export function PrimaryActionButton({
  className,
  variant = "primary",
  ...props
}: PrimaryActionButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[10px] px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
