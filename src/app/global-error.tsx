'use client';

import { useEffect } from 'react';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kristian Buriasco';

// global-error replaces the root layout, so it must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#f4f4f5',
          color: '#18181b',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 }}>
          {SITE_NAME}
        </p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 500, margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: '28rem', fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>
          The application failed to load. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: '0.5rem',
            border: '1px solid #18181b',
            background: 'transparent',
            padding: '0.5rem 1.5rem',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
