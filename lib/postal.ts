export function toPostalPrefix(input: string): string | null {
  if (!input) return null;
  const cleaned = input.toUpperCase().replace(/\s+/g, '');
  const ca = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
  const fsa = /^[A-Z]\d[A-Z]$/;
  const us = /^\d{5}$/;
  if (ca.test(cleaned)) return cleaned.slice(0, 3);
  if (fsa.test(cleaned)) return cleaned;
  if (us.test(cleaned)) return cleaned.slice(0, 3);
  return null;
}

export function isValidPostal(input: string): boolean {
  return toPostalPrefix(input) !== null;
}
