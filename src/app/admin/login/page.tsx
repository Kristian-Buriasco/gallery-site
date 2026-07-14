'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';

type LoginConfig = {
  passwordLoginEnabled: boolean;
  hasPasskeys: boolean;
};

type View = 'passkey' | 'password' | 'recovery';

export default function AdminLoginPage() {
  const router = useRouter();
  const [config, setConfig] = useState<LoginConfig | null>(null);
  const [view, setView] = useState<View>('passkey');
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/login/config')
      .then((r) => r.json())
      .then((data: LoginConfig) => setConfig(data))
      .catch(() => setConfig({ passwordLoginEnabled: true, hasPasskeys: false }));
  }, []);

  async function signInWithPasskey() {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch('/api/admin/passkey/auth/options', {
        method: 'POST',
      });
      if (!optRes.ok) {
        const data = await optRes.json().catch(() => null);
        setError(data?.error ?? 'Passkey sign-in unavailable.');
        return;
      }
      const options = await optRes.json();
      const assertion = await startAuthentication({ optionsJSON: options });
      const verifyRes = await fetch('/api/admin/passkey/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: assertion }),
      });
      if (verifyRes.ok) {
        router.push('/admin');
        router.refresh();
      } else if (verifyRes.status === 429) {
        setError('Too many attempts. Try again later.');
      } else {
        setError('Passkey sign-in failed.');
      }
    } catch {
      setError('Passkey sign-in was cancelled or failed.');
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else if (res.status === 429) {
      setError('Too many attempts. Try again later.');
    } else {
      setError('Invalid password.');
    }
  }

  async function submitRecovery(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/recovery/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: recoveryCode }),
    });
    setBusy(false);
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else if (res.status === 429) {
      setError('Too many attempts. Try again later.');
    } else {
      setError('Invalid recovery code.');
    }
  }

  const loaded = config !== null;
  const showPasskey = config?.hasPasskeys === true;
  const showPassword = config?.passwordLoginEnabled ?? true;

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-xs text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <h1 className="mb-10 text-center text-sm font-light tracking-[0.3em] uppercase">
          Admin
        </h1>

        {view === 'passkey' && (
          <div className="space-y-6">
            {showPasskey ? (
              <button
                type="button"
                disabled={busy}
                onClick={signInWithPasskey}
                className="w-full border border-neutral-900 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-40 dark:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-black"
              >
                {busy ? 'Waiting for passkey…' : 'Sign in with passkey'}
              </button>
            ) : (
              <p className="text-center text-xs text-neutral-500">
                No passkeys registered yet.
              </p>
            )}

            {showPassword && (
              <button
                type="button"
                onClick={() => {
                  setView('password');
                  setError(null);
                }}
                className="block w-full text-center text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Use password instead
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setView('recovery');
                setError(null);
              }}
              className="block w-full text-center text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Lost your device? Use a recovery code
            </button>
          </div>
        )}

        {view === 'password' && showPassword && (
          <form onSubmit={submitPassword} className="space-y-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-center text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
            />
            <button
              type="submit"
              disabled={busy || !password}
              className="w-full border border-neutral-900 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-40 dark:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-black"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('passkey');
                setError(null);
              }}
              className="block w-full text-center text-xs text-neutral-500 underline underline-offset-4"
            >
              Back
            </button>
          </form>
        )}

        {view === 'recovery' && (
          <form onSubmit={submitRecovery} className="space-y-6">
            <input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="Recovery code"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-center font-mono text-sm uppercase outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
            />
            <button
              type="submit"
              disabled={busy || !recoveryCode.trim()}
              className="w-full border border-neutral-900 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-40 dark:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-black"
            >
              {busy ? 'Verifying…' : 'Sign in with recovery code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('passkey');
                setError(null);
              }}
              className="block w-full text-center text-xs text-neutral-500 underline underline-offset-4"
            >
              Back
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-center text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
