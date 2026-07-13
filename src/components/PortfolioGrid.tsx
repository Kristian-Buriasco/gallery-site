'use client';

import { useCallback, useEffect, useState } from 'react';
import Lightbox, { HeartIcon, type LightboxPhoto } from './Lightbox';

export default function PortfolioGrid({
  photos,
  slug,
  showLikeCounts = false,
}: {
  photos: LightboxPhoto[];
  slug: string;
  showLikeCounts?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/portfolio/${slug}/likes`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.photoIds) setLiked(new Set(data.photoIds));
        if (data.counts) setCounts(data.counts);
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
      setLiked((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(photoId);
        else next.add(photoId);
        return next;
      });
      if (showLikeCounts) {
        setCounts((prev) => ({
          ...prev,
          [photoId]: Math.max(0, (prev[photoId] ?? 0) + (isLiked ? -1 : 1)),
        }));
      }
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
        if (showLikeCounts) {
          setCounts((prev) => ({
            ...prev,
            [photoId]: Math.max(0, (prev[photoId] ?? 0) + (isLiked ? 1 : -1)),
          }));
        }
      }
    },
    [liked, slug, showLikeCounts],
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
            <button
              type="button"
              onClick={() => toggleLike(p.id)}
              aria-label={liked.has(p.id) ? 'Unlike photo' : 'Like photo'}
              className={`absolute right-2 bottom-2 hidden items-center gap-1 rounded-full p-1.5 text-xs text-white drop-shadow transition-opacity sm:flex ${
                liked.has(p.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
              }`}
            >
              <HeartIcon filled={liked.has(p.id)} className="h-5 w-5" />
              {showLikeCounts && (
                <span className="tabular-nums">{counts[p.id] ?? 0}</span>
              )}
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
          showLikeCounts={showLikeCounts}
          likeCounts={counts}
        />
      )}
    </>
  );
}
