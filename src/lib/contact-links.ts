/** Build a WhatsApp link from a settings value. */
export function whatsappHref(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 8 && digitsOnly.length === trimmed.replace(/[\s\-()+]/g, '').length) {
    return `https://wa.me/${digitsOnly}`;
  }
  return `https://wa.me/${encodeURIComponent(trimmed.replace(/^@/, ''))}`;
}

export function whatsappLabel(value: string): string {
  return value.trim().replace(/^@/, '');
}
