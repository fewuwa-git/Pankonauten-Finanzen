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

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Öffentliche Routen – kein Auth nötig
    if (pathname === '/login' || pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyToken(token);

    if (!payload) {
        // Token abgelaufen oder ungültig → ausloggen
        const response = NextResponse.redirect(new URL('/login', request.url));
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

    const response = NextResponse.next();
    response.cookies.set('token', newToken, COOKIE_OPTIONS);
    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
