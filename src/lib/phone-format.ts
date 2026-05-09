/** Max digits stored/displayed for NANP-style numbers (optional leading country code 1 is stripped). */
const MAX_DIGITS = 10;

/**
 * Extracts up to 10 national digits; strips a single leading US country code (11 digits starting with 1).
 */
export function digitsFromPhoneInput(value: string): string {
    let d = value.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) {
        d = d.slice(1);
    }
    return d.slice(0, MAX_DIGITS);
}

/**
 * Formats national digits as `(555) 123-4567` while typing or pasting.
 */
export function formatPhoneDigits(digits: string): string {
    const d = digits.slice(0, MAX_DIGITS);
    if (d.length === 0) return '';
    if (d.length <= 3) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function formatPhoneInput(value: string): string {
    return formatPhoneDigits(digitsFromPhoneInput(value));
}
