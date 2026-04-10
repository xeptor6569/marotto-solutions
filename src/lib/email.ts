import nodemailer from 'nodemailer';

export function createTransportFromEnv() {
    const server = process.env.EMAIL_SERVER;
    if (!server) return null;
    return nodemailer.createTransport(server);
}

/** Base URL for links in outbound emails (no trailing slash). */
export function getPublicSiteUrl(): string {
    const raw = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const trimmed = raw.replace(/\/$/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
}
