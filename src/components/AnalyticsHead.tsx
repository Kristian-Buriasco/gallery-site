/**
 * Renders owner-pasted analytics snippets (GA4, Umami, etc.) into <head>.
 * Parses <script> tags from the stored HTML string; falls back to treating
 * the whole value as inline script body if no tags are found.
 */
export default function AnalyticsHead({ html }: { html: string }) {
  const trimmed = html.trim();
  if (!trimmed) return null;

  const nodes: React.ReactNode[] = [];
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = scriptRe.exec(trimmed)) !== null) {
    const attrs = match[1];
    const content = match[2];
    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
    const isAsync = /\basync\b/i.test(attrs);
    if (srcMatch) {
      nodes.push(
        <script key={i++} src={srcMatch[1]} async={isAsync || undefined} />,
      );
    } else if (content.trim()) {
      nodes.push(
        <script key={i++} dangerouslySetInnerHTML={{ __html: content }} />,
      );
    }
  }

  if (nodes.length === 0) {
    nodes.push(
      <script key={0} dangerouslySetInnerHTML={{ __html: trimmed }} />,
    );
  }

  return <>{nodes}</>;
}
