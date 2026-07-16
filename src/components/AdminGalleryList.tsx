'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatBytes } from '@/lib/format-bytes';

export type GalleryListRow = {
  id: string;
  title: string;
  type: 'client' | 'portfolio';
  published: boolean;
  expiresAt: number | null;
  photoCount: number;
  sizeBytes: number;
  expired: boolean;
};

type Filter = 'all' | 'portfolio' | 'client' | 'published' | 'unpublished' | 'expired';

export default function AdminGalleryList({ rows }: { rows: GalleryListRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const filter = (searchParams.get('filter') as Filter) || 'all';

  function setFilter(f: Filter) {
    const p = new URLSearchParams(searchParams.toString());
    if (f === 'all') p.delete('filter');
    else p.set('filter', f);
    router.replace(`/admin?${p.toString()}`);
  }

  function setQuery(val: string) {
    setQ(val);
    const p = new URLSearchParams(searchParams.toString());
    if (val.trim()) p.set('q', val.trim());
    else p.delete('q');
    router.replace(`/admin?${p.toString()}`);
  }

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && !r.title.toLowerCase().includes(needle)) return false;
      if (filter === 'portfolio' && r.type !== 'portfolio') return false;
      if (filter === 'client' && r.type !== 'client') return false;
      if (filter === 'published' && !r.published) return false;
      if (filter === 'unpublished' && r.published) return false;
      if (filter === 'expired' && !r.expired) return false;
      return true;
    });
  }, [rows, q, filter]);

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'client', label: 'Client' },
    { key: 'published', label: 'Published' },
    { key: 'unpublished', label: 'Unpublished' },
    { key: 'expired', label: 'Expired' },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search galleries…"
          className="min-w-[12rem] border-b border-neutral-300 bg-transparent py-1 text-sm outline-none dark:border-neutral-700"
        />
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`rounded-full border px-2.5 py-0.5 text-xs ${
                filter === c.key
                  ? 'border-neutral-900 dark:border-neutral-100'
                  : 'border-neutral-300 dark:border-neutral-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">No galleries match.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {visible.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/galleries/${r.id}`}
                className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-neutral-100/60 dark:hover:bg-neutral-900/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {r.type === 'portfolio' ? 'Portfolio' : 'Client'} · {r.photoCount} photos ·{' '}
                    {formatBytes(r.sizeBytes)}
                    {r.expired ? ' · Expired' : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px]">
                  {r.published ? 'Published' : 'Draft'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
