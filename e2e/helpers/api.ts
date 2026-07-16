import type { APIRequestContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { GalleryRow, PhotoRow } from './env';

export async function adminLogin(
  request: APIRequestContext,
  baseUrl: string,
  password: string,
): Promise<void> {
  const res = await request.post(`${baseUrl}/api/admin/login`, {
    data: { password },
  });
  if (!res.ok()) {
    throw new Error(`Admin login failed: ${res.status()} ${await res.text()}`);
  }
}

export async function createGallery(
  request: APIRequestContext,
  baseUrl: string,
  body: Record<string, unknown>,
): Promise<GalleryRow> {
  const res = await request.post(`${baseUrl}/api/admin/galleries`, { data: body });
  if (!res.ok()) {
    throw new Error(`Create gallery failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

export async function patchGallery(
  request: APIRequestContext,
  baseUrl: string,
  id: string,
  body: Record<string, unknown>,
): Promise<GalleryRow> {
  const res = await request.patch(`${baseUrl}/api/admin/galleries/${id}`, { data: body });
  if (!res.ok()) {
    throw new Error(`Patch gallery failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

export async function uploadPhoto(
  request: APIRequestContext,
  baseUrl: string,
  galleryId: string,
  filePath: string,
): Promise<PhotoRow> {
  const res = await request.post(`${baseUrl}/api/admin/galleries/${galleryId}/photos`, {
    multipart: {
      file: fs.createReadStream(filePath),
    },
  });
  if (!res.ok()) {
    throw new Error(`Upload failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

export async function waitForPhotoReady(
  request: APIRequestContext,
  baseUrl: string,
  galleryId: string,
  photoId: string,
  timeoutMs = 60_000,
): Promise<PhotoRow> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await request.get(`${baseUrl}/api/admin/galleries/${galleryId}/photos`);
    if (res.ok()) {
      const photos = (await res.json()) as PhotoRow[];
      const photo = photos.find((p) => p.id === photoId);
      if (photo?.status === 'ready') return photo;
      if (photo?.status === 'error') throw new Error(`Photo ${photoId} processing failed`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Photo ${photoId} not ready within ${timeoutMs}ms`);
}

export async function unlockGallery(
  request: APIRequestContext,
  baseUrl: string,
  slug: string,
  body: { password?: string; pin?: string },
): Promise<void> {
  const res = await request.post(`${baseUrl}/api/g/${slug}/unlock`, { data: body });
  if (!res.ok()) {
    throw new Error(`Unlock failed: ${res.status()} ${await res.text()}`);
  }
}

export async function ensureVisitor(
  request: APIRequestContext,
  baseUrl: string,
  slug: string,
): Promise<void> {
  const res = await request.post(`${baseUrl}/api/g/${slug}/visitor`, { data: {} });
  if (!res.ok() && res.status() !== 201) {
    throw new Error(`Visitor create failed: ${res.status()} ${await res.text()}`);
  }
}

export async function favoritePhoto(
  request: APIRequestContext,
  baseUrl: string,
  slug: string,
  photoId: string,
  listId?: string | null,
): Promise<void> {
  const res = await request.post(`${baseUrl}/api/g/${slug}/selections`, {
    data: { photoId, ...(listId ? { listId } : {}) },
  });
  if (!res.ok()) {
    throw new Error(`Favorite failed: ${res.status()} ${await res.text()}`);
  }
}

export async function createUploadToken(
  request: APIRequestContext,
  baseUrl: string,
  name: string,
): Promise<{ id: string; token: string }> {
  const res = await request.post(`${baseUrl}/api/admin/upload-tokens`, {
    data: { name },
  });
  if (!res.ok()) {
    throw new Error(`Create token failed: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  return { id: data.id, token: data.token };
}

export function tempImagePath(name: string): string {
  return path.join(process.cwd(), 'e2e', '.tmp', name);
}

export async function inviteCollaborator(
  request: APIRequestContext,
  baseUrl: string,
  galleryId: string,
  email: string,
): Promise<{ collaboratorId: string; onboardingUrl: string; expiresAt: number }> {
  const res = await request.post(`${baseUrl}/api/admin/galleries/${galleryId}/collaborators`, {
    data: { email },
  });
  if (!res.ok()) {
    throw new Error(`Invite collaborator failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

export async function listGalleryCollaborators(
  request: APIRequestContext,
  baseUrl: string,
  galleryId: string,
): Promise<{ grantId: string; collaboratorId: string; email: string }[]> {
  const res = await request.get(`${baseUrl}/api/admin/galleries/${galleryId}/collaborators`);
  if (!res.ok()) {
    throw new Error(`List collaborators failed: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  return data.collaborators ?? [];
}

export async function revokeGrant(
  request: APIRequestContext,
  baseUrl: string,
  grantId: string,
): Promise<void> {
  const res = await request.delete(`${baseUrl}/api/admin/collaborators/grants/${grantId}`);
  if (!res.ok()) {
    throw new Error(`Revoke grant failed: ${res.status()} ${await res.text()}`);
  }
}

export async function setCollaboratorDisabled(
  request: APIRequestContext,
  baseUrl: string,
  collaboratorId: string,
  disabled: boolean,
): Promise<void> {
  const res = await request.post(
    `${baseUrl}/api/admin/collaborators/${collaboratorId}/disable`,
    { data: { disabled } },
  );
  if (!res.ok()) {
    throw new Error(`Set collaborator disabled failed: ${res.status()} ${await res.text()}`);
  }
}
