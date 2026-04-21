type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({
  title = "Something went wrong",
  message,
}: ErrorStateProps) {
  return (
    <section className="eg-card p-5">
      <h2 className="text-lg font-semibold text-danger">{title}</h2>
      <p className="mt-2 text-sm text-text-secondary">{message}</p>
    </section>
  );
}
