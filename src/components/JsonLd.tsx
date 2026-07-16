export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape < so a value containing "</script>" can't break out of the
  // JSON-LD script context (standard JSON-LD hardening). U+2028/2029 are
  // escaped too — they're line terminators in JS but legal in JSON.
  const json = JSON.stringify(data)
    .replaceAll('<', '\\u003c')
    .replaceAll(' ', '\\u2028')
    .replaceAll(' ', '\\u2029');
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
