import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getBelege, saveBeleg, getNextBelegnummer } from '@/lib/data';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const isAdmin = payload.role === 'admin' || payload.role === 'member';
    const userId = isAdmin ? undefined : payload.userId;
    const belege = await getBelege(userId);
    return NextResponse.json(belege);
}

export async function POST(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await req.json();
    const belegnummer = await getNextBelegnummer();
    const beleg = await saveBeleg({
        user_id: body.user_id ?? payload.userId,
        titel: body.titel,
        beschreibung: body.beschreibung,
        netto: Number(body.netto),
        mwst_satz: Number(body.mwst_satz ?? 0),
        betrag: Number(body.betrag),
        belegnummer,
        datum: body.datum,
        status: body.status ?? 'entwurf',
    });
    return NextResponse.json(beleg);
}
