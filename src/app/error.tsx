'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kristian Buriasco';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the browser console for the admin; never render internals.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink dark:bg-paper-dark dark:text-ink-dark">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-7">
        <Link href="/" className="text-[15px] leading-none font-semibold tracking-tight">
          {SITE_NAME}
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs tracking-widest text-muted uppercase dark:text-muted-dark">
          Something went wrong
        </p>
        <h1 className="mt-4 text-2xl font-medium tracking-tight sm:text-3xl">
          We hit an unexpected error
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted dark:text-muted-dark">
          The page failed to load. You can try again, or come back in a moment.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="border border-ink px-6 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-ink hover:text-paper dark:border-ink-dark dark:hover:bg-ink-dark dark:hover:text-paper-dark"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-xs tracking-widest text-muted uppercase underline-offset-4 hover:underline dark:text-muted-dark"
          >
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
