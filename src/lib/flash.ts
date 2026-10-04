/**
 * One-shot "flash" messages that survive a server-action redirect: the action
 * writes a short-lived cookie (flash-server.ts), and FlashToaster shows it as a
 * toast on the next page, then clears it. Encoding lives here so both sides
 * (and tests) agree on the format.
 */

export const FLASH_COOKIE = 'flash';
export const FLASH_MAX_AGE_SECONDS = 30;

export type FlashTone = 'success' | 'error' | 'info';

export interface FlashMessage {
    message: string;
    tone: FlashTone;
    description?: string;
}

const MAX_MESSAGE = 160;
const MAX_DESCRIPTION = 300;

/** JSON payload for the cookie value; Next's cookie API URL-encodes it on write. */
export function serializeFlash(flash: FlashMessage): string {
    return JSON.stringify({
        message: flash.message.slice(0, MAX_MESSAGE),
        tone: flash.tone,
        ...(flash.description ? { description: flash.description.slice(0, MAX_DESCRIPTION) } : {}),
    });
}

function parseJson(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

/** Accepts the raw cookie value (URL-encoded) or the plain JSON payload. */
export function decodeFlash(raw: string | undefined | null): FlashMessage | null {
    if (!raw) return null;
    try {
        let decoded = raw;
        try {
            decoded = decodeURIComponent(raw);
        } catch {
            // Not URL-encoded; fall through with the raw value.
        }
        const parsed = (parseJson(decoded) ?? parseJson(raw)) as Partial<FlashMessage> | null;
        if (!parsed || typeof parsed !== 'object') return null;
        if (typeof parsed.message !== 'string' || !parsed.message.trim()) return null;
        const tone: FlashTone = parsed.tone === 'error' || parsed.tone === 'info' ? parsed.tone : 'success';
        return {
            message: parsed.message.slice(0, MAX_MESSAGE),
            tone,
            ...(typeof parsed.description === 'string' && parsed.description
                ? { description: parsed.description.slice(0, MAX_DESCRIPTION) }
                : {}),
        };
    } catch {
        return null;
    }
}

/** Reads the flash cookie out of a `document.cookie` string. */
export function readFlashFromCookieString(cookieString: string): FlashMessage | null {
    const match = cookieString.match(new RegExp(`(?:^|;\\s*)${FLASH_COOKIE}=([^;]*)`));
    return match ? decodeFlash(match[1]) : null;
}
