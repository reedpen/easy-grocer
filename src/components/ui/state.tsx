import Link from "next/link";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";

type StateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: StateProps) {
  return (
    <section className="eg-card flex flex-col items-center gap-3 p-8 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-lg text-sm text-text-secondary">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref}>
          <PrimaryActionButton>{actionLabel}</PrimaryActionButton>
        </Link>
      ) : null}
    </section>
  );
}

export function ErrorState({ title, description, actionLabel, actionHref }: StateProps) {
  return (
    <section className="eg-card border-danger/30 bg-warning/10 p-6">
      <h2 className="text-base font-semibold text-danger">{title}</h2>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
      {actionLabel && actionHref ? (
        <div className="mt-4">
          <Link href={actionHref}>
            <PrimaryActionButton variant="secondary">{actionLabel}</PrimaryActionButton>
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export function LoadingSkeleton() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <div className="eg-card h-28 animate-pulse bg-surface-strong" />
      <div className="eg-card h-28 animate-pulse bg-surface-strong" />
    </section>
  );
}
