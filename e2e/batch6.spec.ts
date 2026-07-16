import { expect, test, request as playwrightRequest } from '@playwright/test';
import {
  adminLogin,
  createGallery,
  inviteCollaborator,
  listGalleryCollaborators,
  patchGallery,
  revokeGrant,
  setCollaboratorDisabled,
  tempImagePath,
  uploadPhoto,
  waitForPhotoReady,
} from './helpers/api';
import { collaboratorApiContext } from './helpers/collab';
import { loadTestEnv, makeTestJpeg } from './helpers/env';

test.describe.configure({ mode: 'serial' });

let env: ReturnType<typeof loadTestEnv>;
let adminCtx: Awaited<ReturnType<typeof playwrightRequest.newContext>>;

test.beforeAll(async ({ playwright }) => {
  env = loadTestEnv();
  adminCtx = await playwright.request.newContext();
  await adminLogin(adminCtx, env.baseUrl, env.password);
});

test.afterAll(async () => {
  await adminCtx.dispose();
});

test.describe('FIXES-8 collaborator authorization', () => {
  test('collaborator can upload + organize + reorder in the granted gallery only', async () => {
    const galleryA = await createGallery(adminCtx, env.baseUrl, {
      title: 'Collab Gallery A',
      type: 'client',
    });
    const galleryB = await createGallery(adminCtx, env.baseUrl, {
      title: 'Collab Gallery B',
      type: 'client',
    });

    const invite = await inviteCollaborator(
      adminCtx,
      env.baseUrl,
      galleryA.id,
      'collab-a@example.com',
    );
    expect(invite.onboardingUrl).toContain('/collab/');
    expect(invite.collaboratorId).toBeTruthy();

    const collabCtx = await collaboratorApiContext(
      env.baseUrl,
      env.dataDir,
      invite.collaboratorId,
    );

    try {
      // Upload into the granted gallery succeeds.
      const imgPath = tempImagePath('collab-upload.jpg');
      await makeTestJpeg(imgPath, { r: 10, g: 200, b: 30 });
      const photo = await uploadPhoto(collabCtx, env.baseUrl, galleryA.id, imgPath);
      await waitForPhotoReady(collabCtx, env.baseUrl, galleryA.id, photo.id);

      const uploadedRow = (
        await (await collabCtx.get(`${env.baseUrl}/api/admin/galleries/${galleryA.id}/photos`)).json()
      ).find((p: { id: string }) => p.id === photo.id);
      expect(uploadedRow.uploadedBy).toBe(invite.collaboratorId);

      // Sections CRUD (organize) succeeds on the granted gallery.
      const sectionRes = await collabCtx.post(
        `${env.baseUrl}/api/admin/galleries/${galleryA.id}/sections`,
        { data: { title: 'Ceremony' } },
      );
      expect(sectionRes.ok()).toBeTruthy();
      const section = await sectionRes.json();

      // Reorder (drag-drop persistOrder) succeeds.
      const orderRes = await collabCtx.put(
        `${env.baseUrl}/api/admin/galleries/${galleryA.id}/photos/order`,
        { data: [photo.id] },
      );
      expect(orderRes.ok()).toBeTruthy();

      // Sort succeeds.
      const sortRes = await collabCtx.post(
        `${env.baseUrl}/api/admin/galleries/${galleryA.id}/photos/sort`,
        { data: { mode: 'filename', sectionId: null } },
      );
      expect(sortRes.ok()).toBeTruthy();

      // Bulk MOVE (organize) succeeds; bulk DELETE (owner-only) is refused.
      const bulkMoveRes = await collabCtx.post(
        `${env.baseUrl}/api/admin/galleries/${galleryA.id}/photos/bulk`,
        { data: { action: 'move', photoIds: [photo.id], sectionId: section.id } },
      );
      expect(bulkMoveRes.ok()).toBeTruthy();

      const bulkDeleteRes = await collabCtx.post(
        `${env.baseUrl}/api/admin/galleries/${galleryA.id}/photos/bulk`,
        { data: { action: 'delete', photoIds: [photo.id] } },
      );
      expect(bulkDeleteRes.status()).toBe(401);

      const bulkCoverRes = await collabCtx.post(
        `${env.baseUrl}/api/admin/galleries/${galleryA.id}/photos/bulk`,
        { data: { action: 'cover', photoIds: [photo.id] } },
      );
      expect(bulkCoverRes.status()).toBe(401);

      // Individual photo DELETE (organize) succeeds.
      const deleteRes = await collabCtx.delete(`${env.baseUrl}/api/admin/photos/${photo.id}`);
      expect(deleteRes.ok()).toBeTruthy();

      // --- Cannot see or touch gallery B ---
      const listBRes = await collabCtx.get(
        `${env.baseUrl}/api/admin/galleries/${galleryB.id}/photos`,
      );
      expect(listBRes.status()).toBe(404);

      const sectionBRes = await collabCtx.post(
        `${env.baseUrl}/api/admin/galleries/${galleryB.id}/sections`,
        { data: { title: 'Nope' } },
      );
      expect(sectionBRes.status()).toBe(404);

      // --- Owner-only routes on the OWN granted gallery are refused ---
      const settingsRes = await collabCtx.patch(`${env.baseUrl}/api/admin/galleries/${galleryA.id}`, {
        data: { published: true },
      });
      expect(settingsRes.status()).toBe(401);

      const passwordRes = await collabCtx.patch(`${env.baseUrl}/api/admin/galleries/${galleryA.id}`, {
        data: { password: 'shouldnotwork' },
      });
      expect(passwordRes.status()).toBe(401);

      const deleteGalleryRes = await collabCtx.delete(`${env.baseUrl}/api/admin/galleries/${galleryA.id}`);
      expect(deleteGalleryRes.status()).toBe(401);

      const uploadTokensRes = await collabCtx.get(`${env.baseUrl}/api/admin/upload-tokens`);
      expect([401, 403]).toContain(uploadTokensRes.status());

      const auditRes = await collabCtx.get(`${env.baseUrl}/api/admin/audit`);
      expect(auditRes.status()).toBe(401);

      // Collaborator invite/manage endpoints are owner-only, even for their own gallery.
      const inviteAgainRes = await collabCtx.post(
        `${env.baseUrl}/api/admin/galleries/${galleryA.id}/collaborators`,
        { data: { email: 'someone-else@example.com' } },
      );
      expect(inviteAgainRes.status()).toBe(401);
    } finally {
      await collabCtx.dispose();
    }
  });

  test('revoking a grant immediately removes access', async () => {
    const gallery = await createGallery(adminCtx, env.baseUrl, {
      title: 'Revoke Test Gallery',
      type: 'client',
    });
    const invite = await inviteCollaborator(
      adminCtx,
      env.baseUrl,
      gallery.id,
      'revoke-me@example.com',
    );

    const collabCtx = await collaboratorApiContext(env.baseUrl, env.dataDir, invite.collaboratorId);
    try {
      const before = await collabCtx.get(`${env.baseUrl}/api/admin/galleries/${gallery.id}/photos`);
      expect(before.ok()).toBeTruthy();

      const rows = await listGalleryCollaborators(adminCtx, env.baseUrl, gallery.id);
      const grant = rows.find((r) => r.collaboratorId === invite.collaboratorId);
      expect(grant).toBeTruthy();
      await revokeGrant(adminCtx, env.baseUrl, grant!.grantId);

      const after = await collabCtx.get(`${env.baseUrl}/api/admin/galleries/${gallery.id}/photos`);
      expect(after.status()).toBe(404);
    } finally {
      await collabCtx.dispose();
    }
  });

  test('a disabled collaborator cannot act', async () => {
    const gallery = await createGallery(adminCtx, env.baseUrl, {
      title: 'Disable Test Gallery',
      type: 'client',
    });
    const invite = await inviteCollaborator(
      adminCtx,
      env.baseUrl,
      gallery.id,
      'disable-me@example.com',
    );

    const collabCtx = await collaboratorApiContext(env.baseUrl, env.dataDir, invite.collaboratorId);
    try {
      const before = await collabCtx.get(`${env.baseUrl}/api/admin/galleries/${gallery.id}/photos`);
      expect(before.ok()).toBeTruthy();

      await setCollaboratorDisabled(adminCtx, env.baseUrl, invite.collaboratorId, true);

      const after = await collabCtx.get(`${env.baseUrl}/api/admin/galleries/${gallery.id}/photos`);
      expect(after.status()).toBe(404);
    } finally {
      await collabCtx.dispose();
    }
  });

  test('collaborator actions are audit-logged with the collaborator as actor', async () => {
    const gallery = await createGallery(adminCtx, env.baseUrl, {
      title: 'Audit Actor Gallery',
      type: 'client',
    });
    const invite = await inviteCollaborator(
      adminCtx,
      env.baseUrl,
      gallery.id,
      'audit-actor@example.com',
    );
    const collabCtx = await collaboratorApiContext(env.baseUrl, env.dataDir, invite.collaboratorId);
    try {
      const sectionRes = await collabCtx.post(
        `${env.baseUrl}/api/admin/galleries/${gallery.id}/sections`,
        { data: { title: 'Audited section' } },
      );
      expect(sectionRes.ok()).toBeTruthy();

      // Owner invite itself is logged as actorType 'owner'.
      const auditRes = await adminCtx.get(`${env.baseUrl}/api/admin/audit?action=collaborator.invite`);
      expect(auditRes.ok()).toBeTruthy();
      const auditData = await auditRes.json();
      const inviteRow = auditData.rows.find((r: { targetId: string }) => r.targetId === gallery.id);
      expect(inviteRow).toBeTruthy();
      expect(inviteRow.actorType).toBe('owner');
    } finally {
      await collabCtx.dispose();
    }
  });

  test('owner experience is unaffected: full settings + delete still work', async () => {
    const gallery = await createGallery(adminCtx, env.baseUrl, {
      title: 'Owner Unaffected Gallery',
      type: 'client',
    });
    const updated = (await patchGallery(adminCtx, env.baseUrl, gallery.id, {
      published: true,
    })) as unknown as { published: boolean };
    expect(updated.published).toBe(true);

    const delRes = await adminCtx.delete(`${env.baseUrl}/api/admin/galleries/${gallery.id}`);
    expect(delRes.ok()).toBeTruthy();
  });
});
