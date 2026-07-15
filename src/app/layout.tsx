import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import AnalyticsHead from '@/components/AnalyticsHead';
import { getSetting } from '@/lib/settings';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kristian Buriasco';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: `${SITE_NAME} — photography`,
};

// Applied before paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get('x-pathname') ?? '';
  const isPublicPage = !pathname.startsWith('/admin');
  const analyticsHtml = isPublicPage
    ? (getSetting('analytics_head_html') ?? '')
    : '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {analyticsHtml ? <AnalyticsHead html={analyticsHtml} /> : null}
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased dark:bg-paper-dark dark:text-ink-dark">
        {children}
      </body>
    </html>
  );
}
