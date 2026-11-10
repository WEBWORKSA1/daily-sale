// Canadian postal code: A1A 1A1
const PC = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
const FSA = /^[A-Za-z]\d[A-Za-z]$/;

export function isValidPostal(raw: string): boolean {
  const s = (raw||'').replace(/\s+/g,'');
  return PC.test(s) || FSA.test(s);
}

export function toPostalPrefix(raw: string): string | null {
  const s = (raw||'').replace(/\s+/g,'').toUpperCase();
  if (FSA.test(s)) return s;
  if (PC.test(s)) return s.slice(0, 3);
  return null;
}
