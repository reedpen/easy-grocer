import { cn } from "@/lib/ui";

type PlanStatus = "draft" | "confirmed" | "ordered";

type StatusChipProps = {
  status: PlanStatus;
  size?: "compact" | "default";
};

const STYLE_MAP: Record<PlanStatus, string> = {
  draft: "bg-surface-strong text-foreground border-border",
  confirmed: "bg-success/15 text-success border-success/40",
  ordered: "bg-primary/15 text-primary border-primary/40",
};

const SIZE_MAP = {
  compact: "px-2 py-0.5 text-xs",
  default: "px-2.5 py-1 text-sm",
};

export function StatusChip({ status, size = "default" }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        STYLE_MAP[status],
        SIZE_MAP[size],
      )}
    >
      {status}
    </span>
  );
}
