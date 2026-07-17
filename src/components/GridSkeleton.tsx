/** Placeholder grid shown while a gallery/portfolio page streams in. */
export default function GridSkeleton({
  count = 8,
  withHeader = true,
}: {
  count?: number;
  withHeader?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {withHeader && (
        <div className="mb-8 space-y-3">
          <div className="h-6 w-48 animate-pulse rounded bg-line/70 dark:bg-line-dark/60" />
          <div className="h-3 w-24 animate-pulse rounded bg-line/50 dark:bg-line-dark/40" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] animate-pulse rounded bg-line/60 dark:bg-line-dark/50"
          />
        ))}
      </div>
    </div>
  );
}
