import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Serves the uploaded business logo from the persistent data volume.
 * Public on purpose: the logo appears on the public site, sign-in page, and
 * shared documents. Uploads are admin-only (settings action), and filenames
 * are timestamped so aggressive caching is safe.
 */

const BRANDING_DIR = path.join(process.cwd(), 'data', 'branding');

const MIME_BY_EXT: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
};

export async function GET(request: NextRequest) {
    const file = request.nextUrl.searchParams.get('file') || '';
    const name = path.basename(file);
    // Reject anything that is not a plain filename (path traversal).
    if (!name || name !== file) {
        return new NextResponse('Not found', { status: 404 });
    }
    const mime = MIME_BY_EXT[path.extname(name).toLowerCase()];
    if (!mime) {
        return new NextResponse('Not found', { status: 404 });
    }

    try {
        const data = await fs.readFile(path.join(BRANDING_DIR, name));
        return new NextResponse(new Uint8Array(data), {
            headers: {
                'Content-Type': mime,
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch {
        return new NextResponse('Not found', { status: 404 });
    }
}
