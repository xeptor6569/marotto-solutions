/** IANA timezone helpers shared by settings validation and the setup wizard. */

export function isValidTimeZone(value: unknown): value is string {
    if (typeof value !== 'string' || !value.trim()) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value });
        return true;
    } catch {
        return false;
    }
}

/** All zones the runtime knows, falling back to a short common list on older engines. */
export function listTimeZones(): string[] {
    try {
        const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone');
        if (supported && supported.length > 0) return supported;
    } catch {
        // fall through
    }
    return [
        'UTC',
        'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage',
        'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver', 'America/Mexico_City', 'America/Sao_Paulo',
        'Europe/London', 'Europe/Dublin', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam',
        'Europe/Stockholm', 'Europe/Warsaw', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore',
        'Asia/Hong_Kong', 'Asia/Tokyo', 'Australia/Sydney', 'Australia/Perth', 'Pacific/Auckland',
    ];
}
