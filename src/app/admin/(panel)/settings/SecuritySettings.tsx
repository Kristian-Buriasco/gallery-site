'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';

type Passkey = {
  id: string;
  label: string;
  createdAt: number;
  lastUsedAt: number | null;
};

type SecurityState = {
  passkeys: Passkey[];
  passwordLoginEnabled: boolean;
  unusedRecoveryCodes: number;
  canDisablePasswordLogin: boolean;
  disablePasswordReason: string | null;
};

function formatDate(ts: number | null): string {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString();
}

export default function SecuritySettings() {
  const router = useRouter();
  const [state, setState] = useState<SecurityState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [showDisableWarning, setShowDisableWarning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/security');
    if (!res.ok) {
      setError('Failed to load security settings.');
      setLoading(false);
      return;
    }
    setState(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addPasskey() {
    const label = newLabel.trim();
    if (!label) return;
    setAdding(true);
    setError(null);
    try {
      const optRes = await fetch('/api/admin/passkey/register/options', {
        method: 'POST',
      });
      if (!optRes.ok) {
        setError('Could not start passkey registration.');
        return;
      }
      const options = await optRes.json();
      const attestation = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch('/api/admin/passkey/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: attestation, label }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => null);
        setError(data?.error ?? 'Passkey registration failed.');
        return;
      }
      const data = await verifyRes.json();
      if (data.recoveryCodes?.length) {
        setRecoveryCodes(data.recoveryCodes);
      }
      setNewLabel('');
      await load();
      router.refresh();
    } catch {
      setError('Passkey registration was cancelled or failed.');
    } finally {
      setAdding(false);
    }
  }

  async function saveRename(id: string) {
    const label = editLabel.trim();
    if (!label) return;
    const res = await fetch(`/api/admin/passkey/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    if (res.ok) {
      setEditingId(null);
      await load();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Rename failed');
    }
  }

  async function removePasskey(id: string) {
    if (!confirm('Remove this passkey?')) return;
    const res = await fetch(`/api/admin/passkey/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await load();
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Delete failed');
    }
  }

  async function regenerateCodes() {
    if (
      !confirm(
        'Regenerate recovery codes? All existing codes will stop working immediately.',
      )
    ) {
      return;
    }
    setRegenerating(true);
    const res = await fetch('/api/admin/recovery/regenerate', { method: 'POST' });
    setRegenerating(false);
    if (res.ok) {
      const data = await res.json();
      setRecoveryCodes(data.codes ?? null);
      await load();
    } else {
      alert('Could not regenerate recovery codes.');
    }
  }

  async function setPasswordEnabled(enabled: boolean) {
    setToggleBusy(true);
    const res = await fetch('/api/admin/security', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passwordLoginEnabled: enabled }),
    });
    setToggleBusy(false);
    setShowDisableWarning(false);
    if (res.ok) {
      await load();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Could not update password login setting.');
    }
  }

  if (loading) {
    return (
      <section>
        <h2 className="mb-4 text-sm font-medium tracking-widest uppercase">
          Security
        </h2>
        <p className="text-xs text-neutral-500">Loading…</p>
      </section>
    );
  }

  if (!state) {
    return (
      <section>
        <h2 className="mb-4 text-sm font-medium tracking-widest uppercase">
          Security
        </h2>
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-medium tracking-widest uppercase">Security</h2>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {recoveryCodes && (
        <div className="border border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="mb-3 text-xs font-medium text-amber-900 dark:text-amber-200">
            Save these recovery codes now — they will not be shown again.
          </p>
          <ul className="grid grid-cols-2 gap-1 font-mono text-xs text-amber-950 dark:text-amber-100">
            {recoveryCodes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setRecoveryCodes(null)}
            className="mt-4 text-xs underline underline-offset-4"
          >
            I saved them
          </button>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-medium tracking-widest uppercase text-neutral-500">
          Passkeys
        </h3>
        {state.passkeys.length === 0 ? (
          <p className="mb-4 text-xs text-neutral-500">
            No passkeys yet. Add one to sign in without a password.
          </p>
        ) : (
          <ul className="mb-4 space-y-2">
            {state.passkeys.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-neutral-200 px-3 py-2 text-xs dark:border-neutral-800"
              >
                {editingId === p.id ? (
                  <>
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="min-w-0 flex-1 border-b border-neutral-300 bg-transparent py-0.5 outline-none dark:border-neutral-600"
                    />
                    <button
                      type="button"
                      onClick={() => saveRename(p.id)}
                      className="underline underline-offset-4"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-neutral-500"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-medium">{p.label}</span>
                      <span className="ml-2 text-neutral-500">
                        Added {formatDate(p.createdAt)} · Last used{' '}
                        {formatDate(p.lastUsedAt)}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(p.id);
                          setEditLabel(p.label);
                        }}
                        className="underline underline-offset-4"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => removePasskey(p.id)}
                        className="text-red-600 underline underline-offset-4 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs text-neutral-500">
              Label for new passkey
            </span>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="MacBook Touch ID"
              maxLength={100}
              className="w-56 border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700"
            />
          </label>
          <button
            type="button"
            disabled={adding || !newLabel.trim()}
            onClick={addPasskey}
            className="border border-neutral-900 px-4 py-1.5 text-xs tracking-widest uppercase transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-40 dark:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-black"
          >
            {adding ? 'Waiting…' : 'Add passkey'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium tracking-widest uppercase text-neutral-500">
          Recovery codes
        </h3>
        <p className="mb-3 text-xs text-neutral-500">
          {state.unusedRecoveryCodes} unused code
          {state.unusedRecoveryCodes === 1 ? '' : 's'} remaining. Use a recovery
          code to sign in if you lose your passkey device.
        </p>
        <button
          type="button"
          disabled={regenerating}
          onClick={regenerateCodes}
          className="border border-neutral-300 px-4 py-1.5 text-xs tracking-widest uppercase transition-colors hover:border-neutral-900 disabled:opacity-40 dark:border-neutral-700"
        >
          {regenerating ? 'Working…' : 'Regenerate codes'}
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium tracking-widest uppercase text-neutral-500">
          Password login
        </h3>
        <p className="mb-3 text-xs text-neutral-500">
          {state.passwordLoginEnabled
            ? 'Password sign-in is enabled on the admin login page.'
            : 'Password sign-in is disabled. Use a passkey or recovery code.'}
        </p>
        {state.passwordLoginEnabled ? (
          <>
            {!state.canDisablePasswordLogin && state.disablePasswordReason && (
              <p className="mb-2 text-xs text-neutral-500">
                {state.disablePasswordReason}
              </p>
            )}
            <button
              type="button"
              disabled={toggleBusy || !state.canDisablePasswordLogin}
              onClick={() => setShowDisableWarning(true)}
              className="border border-neutral-300 px-4 py-1.5 text-xs tracking-widest uppercase transition-colors hover:border-neutral-900 disabled:opacity-40 dark:border-neutral-700"
            >
              Disable password login
            </button>
            {showDisableWarning && (
              <div className="mt-4 border border-red-300 p-4 dark:border-red-800">
                <p className="mb-3 text-xs">
                  Disabling password login means you can only sign in with a
                  passkey or recovery code. Make sure you have saved your
                  recovery codes.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={toggleBusy}
                    onClick={() => setPasswordEnabled(false)}
                    className="border border-red-600 px-4 py-1.5 text-xs tracking-widest uppercase text-red-600"
                  >
                    Confirm disable
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisableWarning(false)}
                    className="text-xs underline underline-offset-4"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={toggleBusy}
            onClick={() => setPasswordEnabled(true)}
            className="border border-neutral-900 px-4 py-1.5 text-xs tracking-widest uppercase transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-40 dark:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-black"
          >
            Re-enable password login
          </button>
        )}
      </div>
    </section>
  );
}
