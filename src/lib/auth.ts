import { SignJWT, jwtVerify } from 'jose';

// Lazily resolved at request time — not at build/import time.
// Throws clearly if JWT_SECRET is missing when actually needed.
function getJWTSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set. Server cannot handle auth requests without a secure secret.');
    }
    return new TextEncoder().encode(secret);
}

export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    role: 'admin' | 'member' | 'eltern' | 'springerin';
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getJWTSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getJWTSecret());
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}
