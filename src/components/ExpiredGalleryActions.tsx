'use client';

import { useRouter } from 'next/navigation';
import { formatBytes } from '@/lib/format-bytes';

export default function ExpiredGalleryActions({
  id,
  title,
  photoCount,
  sizeBytes,
}: {
  id: string;
  title: string;
  photoCount: number;
  sizeBytes: number;
}) {
  const router = useRouter();

  async function run(action: 'unpublish' | 'delete-photos' | 'delete', confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    const res = await fetch(`/api/admin/galleries/${id}/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Action failed');
    }
  }

  const sizeLabel = formatBytes(sizeBytes);
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="border px-2 py-0.5 text-[11px]"
        onClick={() =>
          run('unpublish', `Unpublish "${title}"? Files stay on disk.`)
        }
      >
        Unpublish
      </button>
      <button
        type="button"
        className="border px-2 py-0.5 text-[11px] text-amber-800 dark:text-amber-200"
        onClick={() =>
          run(
            'delete-photos',
            `Delete ${photoCount} photo file(s) (~${sizeLabel}) from "${title}"?\n\nDatabase records, stats, and selections are kept.`,
          )
        }
      >
        Delete photos
      </button>
      <button
        type="button"
        className="border border-red-600 px-2 py-0.5 text-[11px] text-red-600"
        onClick={() =>
          run(
            'delete',
            `Permanently delete gallery "${title}" and all ${photoCount} photo(s) (~${sizeLabel})?`,
          )
        }
      >
        Delete gallery
      </button>
    </div>
  );
}
