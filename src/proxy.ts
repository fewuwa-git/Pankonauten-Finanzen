import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth';

const INACTIVITY_TIMEOUT = 60 * 60 * 24; // 24 Stunden in Sekunden

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: INACTIVITY_TIMEOUT,
    path: '/',
};

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Öffentliche Routen – kein Auth nötig
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/einladen') ||
        pathname.startsWith('/api/invite')
    ) {
        return NextResponse.next();
    }

    const token = req.cookies.get('token')?.value;

    if (!token) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const payload = await verifyToken(token);

    if (!payload) {
        // Token abgelaufen oder ungültig → ausloggen
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const response = NextResponse.redirect(new URL('/login', req.url));
        response.cookies.delete('token');
        return response;
    }

    // Token gültig → Ablaufzeit erneuern (Sliding Session)
    const newToken = await signToken({
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
    });

    // Impersonation: Wenn Admin und impersonate-Cookie gesetzt → Ansicht als anderer User
    const requestHeaders = new Headers(req.headers);
    const impersonateCookie = req.cookies.get('impersonate')?.value;
    let effectiveUserId = payload.userId;
    let effectiveRole = payload.role;
    let effectiveName = payload.name;
    let effectiveEmail = payload.email;
    let isImpersonating = false;

    if (payload.role === 'admin' && impersonateCookie) {
        try {
            const imp = JSON.parse(impersonateCookie);
            if (imp.userId && imp.name && imp.email && imp.role) {
                effectiveUserId = imp.userId;
                effectiveRole = imp.role;
                effectiveName = imp.name;
                effectiveEmail = imp.email;
                isImpersonating = true;
            }
        } catch { /* ungültiger Cookie → ignorieren */ }
    }

    // Payload als Request-Header weitergeben → Pages müssen Token nicht nochmal verifizieren
    requestHeaders.set('x-user-id', effectiveUserId);
    requestHeaders.set('x-user-role', effectiveRole);
    requestHeaders.set('x-user-name', effectiveName);
    requestHeaders.set('x-user-email', effectiveEmail);
    if (isImpersonating) {
        requestHeaders.set('x-real-admin-name', payload.name);
    } else {
        requestHeaders.delete('x-real-admin-name');
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set('token', newToken, COOKIE_OPTIONS);
    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
