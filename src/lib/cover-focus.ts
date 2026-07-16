export function coverObjectPosition(focusX: number, focusY: number): string {
  const x = Math.min(100, Math.max(0, Math.round(focusX)));
  const y = Math.min(100, Math.max(0, Math.round(focusY)));
  return `${x}% ${y}%`;
}
