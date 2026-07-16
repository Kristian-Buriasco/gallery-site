import sharp from 'sharp';

/** Generate a tiny base64 JPEG placeholder (~24px wide). */
export async function generatePlaceholder(srcPath: string): Promise<string> {
  const buf = await sharp(srcPath)
    .rotate()
    .resize(24, 24, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 40, progressive: true })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

export function photoAltText(
  photo: { altText?: string | null; filename: string },
  galleryTitle: string,
): string {
  if (photo.altText?.trim()) return photo.altText.trim().slice(0, 300);
  const base = photo.filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  return `${galleryTitle} — ${base}`.slice(0, 300);
}

export { coverObjectPosition } from './cover-focus';
