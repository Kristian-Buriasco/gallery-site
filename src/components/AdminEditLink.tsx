import Link from 'next/link';
import { isAdmin } from '@/lib/session';

/**
 * Floating "Edit" link, shown only to a logged-in admin, on public pages.
 * Links to wherever that content is managed in the admin.
 */
export default async function AdminEditLink({
  href,
  label = 'Edit',
}: {
  href: string;
  label?: string;
}) {
  if (!(await isAdmin())) return null;
  return (
    <Link
      href={href}
      className="fixed right-5 bottom-5 z-30 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium shadow-lg transition-colors hover:border-accent hover:text-accent dark:border-line-dark dark:bg-surface-dark dark:hover:border-accent-dark dark:hover:text-accent-dark"
    >
      {label}
    </Link>
  );
}
