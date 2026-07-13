import fs from 'node:fs';
import { redirect } from 'next/navigation';
import { getSetting } from '@/lib/settings';
import { watermarkPath } from '@/lib/paths';
import { isAdmin } from '@/lib/session';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  // Per-page auth check: the layout check alone is bypassable via RSC
  // segment requests (layouts render in parallel with pages).
  if (!(await isAdmin())) redirect('/admin/login');

  return (
    <SettingsForm
      initialAbout={getSetting('aboutContent') ?? ''}
      initialContact={getSetting('contactContent') ?? ''}
      initialAnalyticsHeadHtml={getSetting('analytics_head_html') ?? ''}
      hasWatermark={fs.existsSync(watermarkPath())}
    />
  );
}
