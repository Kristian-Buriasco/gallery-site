import fs from 'node:fs';
import { PassThrough, Readable } from 'node:stream';
import archiver from 'archiver';
import { and, asc, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { isGalleryExpired, logDownloadEvent } from '@/lib/downloads';
import { zipEntriesForGallery } from '@/lib/sections';
import { hasGalleryAccess, isAdmin } from '@/lib/session';
import { galleryRequiresAccess } from '@/lib/pin';

type Params = { params: Promise<{ file: string }> };

function titleSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'gallery'
  );
}

export async function GET(_req: Request, { params }: Params) {
  const { file } = await params;
  if (!file.endsWith('.zip')) return new Response('Not found', { status: 404 });
  const slug = file.slice(0, -4);

  const db = getDb();
  const gallery = db
    .select()
    .from(schema.galleries)
    .where(eq(schema.galleries.slug, slug))
    .get();
  if (!gallery) return new Response('Not found', { status: 404 });

  if (!(await isAdmin())) {
    if (!gallery.published || isGalleryExpired(gallery)) {
      return new Response('Not found', { status: 404 });
    }
    if (
      gallery.type === 'client' &&
      galleryRequiresAccess(gallery) &&
      !(await hasGalleryAccess(gallery.id))
    ) {
      return new Response('Forbidden', { status: 403 });
    }
    if (gallery.type === 'portfolio' || !gallery.downloadEnabled) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const photos = db
    .select()
    .from(schema.photos)
    .where(
      and(eq(schema.photos.galleryId, gallery.id), eq(schema.photos.status, 'ready')),
    )
    .orderBy(asc(schema.photos.sortOrder))
    .all();

  const sections = db
    .select()
    .from(schema.sections)
    .where(eq(schema.sections.galleryId, gallery.id))
    .orderBy(asc(schema.sections.sortOrder))
    .all();

  const entries = zipEntriesForGallery(gallery.id, photos, sections);

  const archive = archiver('zip', { store: true });
  const out = new PassThrough();
  archive.pipe(out);

  const abort = (err: Error) => {
    console.error('[zip] stream error:', err.message);
    archive.destroy();
    out.destroy(err);
  };
  archive.on('error', abort);
  archive.on('warning', (err) => console.warn('[zip] warning:', err.message));
  out.on('error', () => {});

  for (const entry of entries) {
    if (fs.existsSync(entry.filePath)) {
      archive.file(entry.filePath, { name: entry.path });
    }
  }
  archive.finalize().catch(abort);

  logDownloadEvent(gallery, 'zip', null, null);

  return new Response(Readable.toWeb(out) as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${titleSlug(gallery.title)}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
}
