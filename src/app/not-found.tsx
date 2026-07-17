import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs tracking-widest text-muted uppercase dark:text-muted-dark">
          404
        </p>
        <h1 className="mt-4 text-2xl font-medium tracking-tight sm:text-3xl">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted dark:text-muted-dark">
          The gallery may be private, unpublished, or the link may be incorrect.
          Check the link with the person who shared it, or head back home.
        </p>
        <Link
          href="/"
          className="mt-8 border border-ink px-6 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-ink hover:text-paper dark:border-ink-dark dark:hover:bg-ink-dark dark:hover:text-paper-dark"
        >
          Back to home
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
