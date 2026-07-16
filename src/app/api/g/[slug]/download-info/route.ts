import { and, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { errorJson, json } from '@/lib/api';
import { formatBytes } from '@/lib/disk';
import { canViewGallery } from '@/lib/gallery-auth';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const gallery = getDb()
    .select()
    .from(schema.galleries)
    .where(and(eq(schema.galleries.slug, slug), eq(schema.galleries.type, 'client')))
    .get();
  if (!gallery || !(await canViewGallery(gallery))) {
    return errorJson('Not found', 404);
  }

  const row = getDb()
    .select({
      count: sql<number>`count(*)`,
      bytes: sql<number>`coalesce(sum(${schema.photos.sizeBytes}), 0)`,
    })
    .from(schema.photos)
    .where(
      and(eq(schema.photos.galleryId, gallery.id), eq(schema.photos.status, 'ready')),
    )
    .get();

  return json({
    count: row?.count ?? 0,
    sizeBytes: row?.bytes ?? 0,
    sizeLabel: formatBytes(row?.bytes ?? 0),
  });
}
