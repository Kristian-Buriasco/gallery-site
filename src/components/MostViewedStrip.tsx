import type { Photo } from '@/db/schema';

export default function MostViewedStrip({
  items,
  photos,
}: {
  items: { photoId: string; count: number }[];
  photos: Photo[];
}) {
  if (items.length === 0) return null;
  const byId = new Map(photos.map((p) => [p.id, p]));

  return (
    <section className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
      <h2 className="mb-3 text-xs tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
        Most viewed
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map(({ photoId, count }) => {
          const p = byId.get(photoId);
          if (!p || p.status !== 'ready') return null;
          return (
            <div key={photoId} className="w-20 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/img/${photoId}/thumb?v=${p.updatedAt}`}
                alt={p.filename}
                className="aspect-square w-full rounded object-cover"
              />
              <p className="mt-1 text-center text-[10px] text-neutral-500 tabular-nums">
                {count}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
