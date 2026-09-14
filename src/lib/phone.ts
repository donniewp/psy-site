/** Accept common phone formatting; keep international numbers available. */
export function normalizePhone(value: string): string | null {
  const raw = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.length === 10) digits = `7${digits}`;
  else if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  return `+${digits}`;
}
