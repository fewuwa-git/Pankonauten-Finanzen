import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, updateUserLastLogin } from '@/lib/data';
import { signToken } from '@/lib/auth';

// ─── In-memory rate limiter ────────────────────────────────────────────────────
// Tracks failed login attempts per IP. Resets after WINDOW_MS.
// Note: resets on server restart. For multi-instance deployments use Redis.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (!entry || now > entry.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true };
    }

    if (entry.count >= MAX_ATTEMPTS) {
        return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }

    entry.count++;
    return { allowed: true };
}

function clearRateLimit(ip: string) {
    loginAttempts.delete(ip);
}

// ─── POST /api/auth — Login ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: `Zu viele Anmeldeversuche. Bitte warte ${rateLimit.retryAfter} Sekunden.` },
            {
                status: 429,
                headers: { 'Retry-After': String(rateLimit.retryAfter) },
            }
        );
    }

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
        }

        // Login successful — clear rate limit counter
        clearRateLimit(ip);

        // Update last login timestamp without blocking the response
        updateUserLastLogin(user.id, new Date().toISOString()).catch(() => {
            console.error('Failed to update last_login_at for user:', user.id);
        });

        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        const response = NextResponse.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error: unknown) {
        // Log full error details server-side only — never expose to client
        console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');

        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
            return NextResponse.json(
                { error: 'Datenbankverbindung fehlgeschlagen. Bitte prüfe den SSH-Tunnel.' },
                { status: 503 }
            );
        }

        return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
    }
}

// ─── DELETE /api/auth — Logout ─────────────────────────────────────────────────
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('token');
    return response;
}
