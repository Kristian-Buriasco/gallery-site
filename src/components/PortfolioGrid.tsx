'use client';

import { useCallback, useEffect, useState } from 'react';
import Lightbox, { HeartIcon, type LightboxPhoto } from './Lightbox';

export default function PortfolioGrid({
  photos,
  slug,
}: {
  photos: LightboxPhoto[];
  slug: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/portfolio/${slug}/likes`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.photoIds) setLiked(new Set(data.photoIds));
      })
      .catch(() => {
        /* likes are non-essential */
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggleLike = useCallback(
    async (photoId: string) => {
      const isLiked = liked.has(photoId);
      // Optimistic update
      setLiked((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(photoId);
        else next.add(photoId);
        return next;
      });
      const res = await fetch(`/api/portfolio/${slug}/likes`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      if (!res.ok) {
        setLiked((prev) => {
          const next = new Set(prev);
          if (isLiked) next.add(photoId);
          else next.delete(photoId);
          return next;
        });
      }
    },
    [liked, slug],
  );

  return (
    <>
      <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>div]:mb-3">
        {photos.map((p, i) => (
          <div key={p.id} className="group relative">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="block w-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/img/${p.id}/thumb`}
                alt={p.filename}
                loading="lazy"
                width={p.width}
                height={p.height}
                className="w-full"
              />
            </button>
            {/* Like heart: hover-only, desktop-only, no public counts. */}
            <button
              type="button"
              onClick={() => toggleLike(p.id)}
              aria-label={liked.has(p.id) ? 'Unlike photo' : 'Like photo'}
              className={`absolute right-2 bottom-2 hidden rounded-full p-1.5 text-white drop-shadow transition-opacity sm:block ${
                liked.has(p.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
              }`}
            >
              <HeartIcon filled={liked.has(p.id)} className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      {open !== null && (
        <Lightbox
          photos={photos}
          index={open}
          onClose={() => setOpen(null)}
          onNavigate={setOpen}
          selectedIds={liked}
          onToggleSelect={toggleLike}
        />
      )}
    </>
  );
}
