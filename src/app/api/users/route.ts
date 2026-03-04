import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUsers, saveUser, getUserByEmail } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '@/lib/auth';
import { sendInviteEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (payload.role === 'admin') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const users = (await getUsers()).map(({ password: _p, invite_token: _t, invite_expires_at: _e, ...u }) => u);
        return NextResponse.json(users);
    } else {
        const user = await getUserByEmail(payload.email);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _p, invite_token: _t, invite_expires_at: _e, ...u } = user;
        return NextResponse.json([u]);
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;
        const payload = token ? await verifyToken(token) : null;
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { name, email, role } = await req.json();
        if (!name || !email) {
            return NextResponse.json({ error: 'Name und E-Mail erforderlich' }, { status: 400 });
        }
        const existing = await getUserByEmail(email);
        if (existing) {
            return NextResponse.json({ error: 'E-Mail bereits vergeben' }, { status: 409 });
        }

        const inviteToken = uuidv4();
        const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://finanzen.pankonauten.de';
        const inviteUrl = `${baseUrl}/einladen/${inviteToken}`;

        // Use a random unusable password hash so the column is never empty
        const randomPassword = await bcrypt.hash(uuidv4(), 10);

        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: randomPassword,
            role: role || 'member',
            status: 'invited',
            invite_token: inviteToken,
            invite_expires_at: inviteExpiresAt,
            created_at: new Date().toISOString(),
        };
        await saveUser(newUser);

        // Send invite email – non-blocking failure
        try {
            await sendInviteEmail(email, name, inviteUrl);
        } catch (emailErr) {
            console.error('Invite email failed:', emailErr);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _p, invite_token: _t, invite_expires_at: _e, ...userWithoutSecrets } = newUser;
        return NextResponse.json({ ...userWithoutSecrets, inviteUrl }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
    }
}
