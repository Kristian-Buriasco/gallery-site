import { headers } from 'next/headers';
import { peekInvite } from '@/lib/collaborators';
import { getSetting } from '@/lib/settings';
import { parseLang } from '@/lib/i18n';
import CollabOnboardClient from './CollabOnboardClient';

export const dynamic = 'force-dynamic';

export default async function CollabOnboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = peekInvite(token);
  const lang = parseLang(getSetting('defaultLanguage'));
  // Touch headers() to keep this dynamic even if getSetting is memoized.
  await headers();

  return (
    <CollabOnboardClient
      token={token}
      valid={!!invite}
      galleryTitle={invite?.galleryTitle ?? null}
      lang={lang}
    />
  );
}
