export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-strong" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-strong" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-surface-strong"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
