/**
 * Normalizes phone numbers (especially US formats) for duplicate detection & clean storage.
 * e.g. "(555) 234-5678" -> "+15552345678" / "5552345678"
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (!digitsOnly) return '';

  // 10-digit US phone
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  // 11-digit US phone starting with 1
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}

export function formatDisplayPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return rawPhone;
}
