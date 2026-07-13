import { notFound, redirect } from 'next/navigation';
import { asc, eq, gte, inArray, max, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { dirSizeBytes } from '@/lib/disk';
import { galleryDir } from '@/lib/paths';
import { BASE_URL } from '@/lib/env';
import { isAdmin } from '@/lib/session';
import GalleryAdmin from './GalleryAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Per-page auth check: the layout check alone is bypassable via RSC
  // segment requests (layouts render in parallel with pages).
  if (!(await isAdmin())) redirect('/admin/login');

  const { id } = await params;
  const db = getDb();
  const gallery = db
    .select()
    .from(schema.galleries)
    .where(eq(schema.galleries.id, id))
    .get();
  if (!gallery) notFound();

  const photos = db
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.galleryId, id))
    .orderBy(asc(schema.photos.sortOrder))
    .all();

  const visitors = db
    .select()
    .from(schema.visitors)
    .where(eq(schema.visitors.galleryId, id))
    .orderBy(asc(schema.visitors.createdAt))
    .all();

  const selections =
    photos.length > 0
      ? db
          .select({
            photoId: schema.selections.photoId,
            visitorId: schema.selections.visitorId,
          })
          .from(schema.selections)
          .where(
            inArray(
              schema.selections.photoId,
              photos.map((p) => p.id),
            ),
          )
          .all()
      : [];

  const likeCountRows =
    photos.length > 0
      ? db
          .select({
            photoId: schema.likes.photoId,
            count: sql<number>`count(*)`,
          })
          .from(schema.likes)
          .where(
            inArray(
              schema.likes.photoId,
              photos.map((p) => p.id),
            ),
          )
          .groupBy(schema.likes.photoId)
          .all()
      : [];

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const viewTotals = db
    .select({
      total: sql<number>`count(*)`,
      lastAt: max(schema.viewEvents.createdAt),
    })
    .from(schema.viewEvents)
    .where(eq(schema.viewEvents.galleryId, id))
    .get();
  const last7 =
    db
      .select({ c: sql<number>`count(*)` })
      .from(schema.viewEvents)
      .where(
        sql`${schema.viewEvents.galleryId} = ${id} and ${gte(schema.viewEvents.createdAt, sevenDaysAgo)}`,
      )
      .get()?.c ?? 0;

  return (
    <GalleryAdmin
      gallery={gallery}
      initialPhotos={photos}
      visitors={visitors.map((v) => ({ id: v.id, name: v.name, email: v.email }))}
      selections={selections}
      likeCounts={Object.fromEntries(likeCountRows.map((r) => [r.photoId, r.count]))}
      viewStats={{
        total: viewTotals?.total ?? 0,
        last7,
        lastAt: viewTotals?.lastAt ?? null,
      }}
      sizeBytes={dirSizeBytes(galleryDir(id))}
      shareUrl={
        gallery.type === 'client'
          ? `${BASE_URL}/g/${gallery.slug}`
          : `${BASE_URL}/portfolio/${gallery.slug}`
      }
    />
  );
}
