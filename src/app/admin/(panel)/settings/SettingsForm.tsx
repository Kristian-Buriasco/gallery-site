'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsForm({
  initialAbout,
  initialContact,
  initialAnalyticsHeadHtml,
  initialHomeEyebrow,
  initialHomeHeadline,
  initialHomeIntro,
  initialContactEmail,
  initialContactInstagram,
  initialContactWhatsapp,
  initialFooterContent,
  initialDefaultLanguage,
  hasWatermark,
}: {
  initialAbout: string;
  initialContact: string;
  initialAnalyticsHeadHtml: string;
  initialHomeEyebrow: string;
  initialHomeHeadline: string;
  initialHomeIntro: string;
  initialContactEmail: string;
  initialContactInstagram: string;
  initialContactWhatsapp: string;
  initialFooterContent: string;
  initialDefaultLanguage: string;
  hasWatermark: boolean;
}) {
  const router = useRouter();
  const [about, setAbout] = useState(initialAbout);
  const [contact, setContact] = useState(initialContact);
  const [analyticsHeadHtml, setAnalyticsHeadHtml] = useState(
    initialAnalyticsHeadHtml,
  );
  const [homeEyebrow, setHomeEyebrow] = useState(initialHomeEyebrow);
  const [homeHeadline, setHomeHeadline] = useState(initialHomeHeadline);
  const [homeIntro, setHomeIntro] = useState(initialHomeIntro);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [contactInstagram, setContactInstagram] = useState(initialContactInstagram);
  const [contactWhatsapp, setContactWhatsapp] = useState(initialContactWhatsapp);
  const [footer, setFooter] = useState(initialFooterContent);
  const [defaultLanguage, setDefaultLanguage] = useState(initialDefaultLanguage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wmBusy, setWmBusy] = useState(false);
  const [wmVersion, setWmVersion] = useState(0);

  async function saveText() {
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aboutContent: about,
        contactContent: contact,
        analyticsHeadHtml,
        homeEyebrow,
        homeHeadline,
        homeIntro,
        contactEmail,
        contactInstagram,
        contactWhatsapp,
        footerContent: footer,
        defaultLanguage,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  async function uploadWatermark(file: File) {
    setWmBusy(true);
    const form = new FormData();
    form.append('watermark', file);
    const res = await fetch('/api/admin/settings', { method: 'POST', body: form });
    setWmBusy(false);
    if (res.ok) {
      setWmVersion((v) => v + 1);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Upload failed');
    }
  }

  async function removeWatermark() {
    if (!confirm('Remove the watermark image?')) return;
    setWmBusy(true);
    await fetch('/api/admin/settings', { method: 'DELETE' });
    setWmBusy(false);
    router.refresh();
  }

  const textareaClass =
    'w-full border border-neutral-300 bg-transparent p-3 text-sm leading-6 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100';

  return (
    <div className="max-w-2xl space-y-12">
      <section>
        <h1 className="mb-4 text-sm font-medium tracking-widest uppercase">
          Watermark
        </h1>
        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
          PNG with transparency. Composited bottom-right on web-size images of
          galleries with watermarking enabled.
        </p>
        {hasWatermark && (
          <div className="mb-4 inline-block bg-neutral-200 p-4 dark:bg-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/settings/watermark?v=${wmVersion}`}
              alt="Current watermark"
              className="max-h-24"
            />
          </div>
        )}
        <div className="flex items-center gap-3 text-xs">
          <label className="cursor-pointer border border-neutral-300 px-4 py-1.5 tracking-widest uppercase transition-colors hover:border-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-100">
            {wmBusy ? 'Working…' : hasWatermark ? 'Replace' : 'Upload PNG'}
            <input
              type="file"
              accept="image/png"
              hidden
              disabled={wmBusy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadWatermark(f);
                e.target.value = '';
              }}
            />
          </label>
          {hasWatermark && (
            <button
              type="button"
              disabled={wmBusy}
              onClick={removeWatermark}
              className="text-neutral-500 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Remove
            </button>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-medium tracking-widest uppercase">Site content</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Homepage hero copy and contact handles shown on the public contact page.
        </p>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            Homepage eyebrow
          </span>
          <input
            value={homeEyebrow}
            onChange={(e) => setHomeEyebrow(e.target.value)}
            maxLength={200}
            className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            Homepage headline
          </span>
          <input
            value={homeHeadline}
            onChange={(e) => setHomeHeadline(e.target.value)}
            maxLength={200}
            className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            Default client gallery language
          </span>
          <select
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value)}
            className="border-b border-neutral-300 bg-transparent py-2 text-sm outline-none dark:border-neutral-700"
          >
            <option value="en">English</option>
            <option value="nl">Nederlands</option>
            <option value="it">Italiano</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            Homepage intro
          </span>
          <textarea
            value={homeIntro}
            onChange={(e) => setHomeIntro(e.target.value)}
            rows={4}
            maxLength={2000}
            className={textareaClass}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            Contact email (optional)
          </span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            maxLength={200}
            className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            Instagram handle
          </span>
          <input
            value={contactInstagram}
            onChange={(e) => setContactInstagram(e.target.value)}
            maxLength={200}
            placeholder="_kri14_"
            className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            WhatsApp number or link
          </span>
          <input
            value={contactWhatsapp}
            onChange={(e) => setContactWhatsapp(e.target.value)}
            maxLength={200}
            placeholder="kristianburiasco"
            className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            Footer text (shown at the bottom of public pages)
          </span>
          <textarea
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="e.g. Based in Torino · Available worldwide"
            className={textareaClass}
          />
        </label>
        <button
          type="button"
          onClick={saveText}
          disabled={saving}
          className="border border-neutral-900 px-6 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-40 dark:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-black"
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save site content'}
        </button>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-medium tracking-widest uppercase">Pages</h2>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            About page content
          </span>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={8}
            className={textareaClass}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
            Contact page content
          </span>
          <textarea
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            rows={6}
            className={textareaClass}
          />
        </label>
        <button
          type="button"
          onClick={saveText}
          disabled={saving}
          className="border border-neutral-900 px-6 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-40 dark:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-black"
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium tracking-widest uppercase">
          Analytics snippet
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Optional HTML pasted into the public site&apos;s &lt;head&gt; (e.g. a
          future GA4 or Umami script). Executed as-is on public pages only —
          never on /admin. Leave empty to disable.
        </p>
        <textarea
          value={analyticsHeadHtml}
          onChange={(e) => setAnalyticsHeadHtml(e.target.value)}
          rows={6}
          className={textareaClass}
          placeholder='<script async src="https://…"></script>'
        />
        <button
          type="button"
          onClick={saveText}
          disabled={saving}
          className="border border-neutral-900 px-6 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-40 dark:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-black"
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save analytics snippet'}
        </button>
      </section>
    </div>
  );
}
