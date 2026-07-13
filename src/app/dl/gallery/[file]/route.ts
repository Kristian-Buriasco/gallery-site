import fs from 'node:fs';
import { PassThrough, Readable } from 'node:stream';
import archiver from 'archiver';
import { asc, and, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { originalPath } from '@/lib/paths';
import { hasGalleryAccess, isAdmin } from '@/lib/session';

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
    // Unpublished must be indistinguishable from nonexistent.
    if (!gallery.published) return new Response('Not found', { status: 404 });
    if (
      gallery.type === 'client' &&
      gallery.passwordHash &&
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

  // Store mode: JPEGs don't compress, keep CPU near zero. Stream straight
  // through to the response; nothing is buffered or written to disk.
  const archive = archiver('zip', { store: true });
  const out = new PassThrough();
  archive.pipe(out);

  // Every failure path must terminate the response cleanly instead of
  // letting an 'error' event crash the (single) Node process.
  const abort = (err: Error) => {
    console.error('[zip] stream error:', err.message);
    archive.destroy();
    out.destroy(err);
  };
  archive.on('error', abort);
  archive.on('warning', (err) => console.warn('[zip] warning:', err.message));
  out.on('error', () => {
    /* consumer gone or aborted; archive already destroyed via abort() */
  });

  for (const photo of photos) {
    const p = originalPath(photo.galleryId, photo.filename);
    if (fs.existsSync(p)) {
      // archive.file() lazily opens the file and routes open/read errors
      // through archiver's own error handling (caught by abort above).
      archive.file(p, { name: photo.filename });
    }
  }
  archive.finalize().catch(abort);

  return new Response(Readable.toWeb(out) as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${titleSlug(gallery.title)}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
}
