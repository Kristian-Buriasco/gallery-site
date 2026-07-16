import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/session';

export default async function AdminSharePage({
  searchParams,
}: {
  searchParams: Promise<{ received?: string }>;
}) {
  if (!(await isAdmin())) redirect('/admin/login?from=share');
  const { received } = await searchParams;
  return (
    <div className="mx-auto max-w-lg py-12">
      <h1 className="mb-4 text-sm font-medium tracking-widest uppercase">Share to album</h1>
      {received ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Photos received from your device. Open a gallery and use Upload to add them — shared
          files cannot be held across login automatically.
        </p>
      ) : (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Use your phone&apos;s Share menu → Albm while logged in, then upload into the gallery
          you want.
        </p>
      )}
      <a href="/admin" className="mt-6 inline-block text-sm underline">
        Back to galleries
      </a>
    </div>
  );
}
