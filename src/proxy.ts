import { NextResponse, type NextRequest } from 'next/server';
import { isDocsHost } from '@/lib/docs';

/**
 * Serves the documentation site at the root of the docs hostname by rewriting
 * `/x` to the `/docs/x` routes. Every other host passes straight through.
 */
export function proxy(request: NextRequest) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (!isDocsHost(host)) return NextResponse.next();

    const { pathname } = request.nextUrl;
    if (pathname === '/docs' || pathname.startsWith('/docs/')) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? '/docs' : `/docs${pathname}`;
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: [
        '/((?!_next/|api/|favicon\\.ico|icon-|apple-touch-icon|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml).*)',
    ],
};
