import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { saveBeleg, deleteBeleg, getBelegById } from '@/lib/data';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get('token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    const existing = await getBelegById(id);
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

    const isAdmin = payload.role === 'admin' || payload.role === 'member';
    if (!isAdmin && existing.user_id !== payload.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const beleg = await saveBeleg({ ...existing, ...body });
        return NextResponse.json(beleg);
    } catch {
        return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get('token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;

    const existing = await getBelegById(id);
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

    const isAdmin = payload.role === 'admin' || payload.role === 'member';
    if (!isAdmin && existing.user_id !== payload.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteBeleg(id);
    return NextResponse.json({ success: true });
}
