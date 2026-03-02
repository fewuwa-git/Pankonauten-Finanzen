import { SignJWT, jwtVerify } from 'jose';

const jwtSecretValue = process.env.JWT_SECRET;
if (!jwtSecretValue) {
    throw new Error('JWT_SECRET environment variable is not set. Server cannot start without a secure secret.');
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretValue);

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
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}
