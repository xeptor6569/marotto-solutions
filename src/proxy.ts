
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    // If access-control is enabled via env var (e.g. for Authentik protection check)
    // This is optional if the proxy handles block/allow, but good for reading user context.

    // NOTE: Authentik usually sits in front. If we want to secure it, we rely on the proxy.
    // If requests reach here without X-authentik-username (or similar), we could block if strict mode is on.

    // For now, we will just allow requests through. If you want strict checking:
    // const user = request.headers.get('x-authentik-username') || request.headers.get('remote-user');
    // if (request.nextUrl.pathname.startsWith('/dashboard') && !user && process.env.STRICT_AUTH === 'true') {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
};
