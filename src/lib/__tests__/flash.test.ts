import { describe, expect, it } from 'vitest';
import { decodeFlash, readFlashFromCookieString, serializeFlash } from '@/lib/flash';

/** What the browser sees after Next's cookie API URL-encodes the payload. */
function asCookieValue(payload: string): string {
    return encodeURIComponent(payload);
}

describe('flash messages', () => {
    it('round-trips through the cookie encoding', () => {
        const value = asCookieValue(serializeFlash({ message: 'Invoice INV-0042 saved', tone: 'success', description: 'Ready; to send' }));
        expect(value).not.toMatch(/[;,\s]/);
        expect(decodeFlash(value)).toEqual({
            message: 'Invoice INV-0042 saved',
            tone: 'success',
            description: 'Ready; to send',
        });
    });

    it('also accepts the plain JSON payload', () => {
        expect(decodeFlash(serializeFlash({ message: 'Saved', tone: 'info' }))).toEqual({ message: 'Saved', tone: 'info' });
    });

    it('reads the flash cookie out of a document.cookie string', () => {
        const cookie = `appearance=dark; flash=${asCookieValue(serializeFlash({ message: 'Deleted', tone: 'info' }))}; other=1`;
        expect(readFlashFromCookieString(cookie)).toEqual({ message: 'Deleted', tone: 'info' });
        expect(readFlashFromCookieString('appearance=dark')).toBeNull();
    });

    it('rejects malformed or empty payloads and defaults unknown tones', () => {
        expect(decodeFlash('not-json')).toBeNull();
        expect(decodeFlash('%E0%A4%A')).toBeNull();
        expect(decodeFlash(asCookieValue(JSON.stringify({ message: '  ' })))).toBeNull();
        expect(decodeFlash(asCookieValue(JSON.stringify({ message: 'Hi', tone: 'shout' })))?.tone).toBe('success');
    });

    it('caps message length', () => {
        const long = 'x'.repeat(500);
        expect(decodeFlash(asCookieValue(serializeFlash({ message: long, tone: 'success' })))?.message.length).toBe(160);
    });
});
