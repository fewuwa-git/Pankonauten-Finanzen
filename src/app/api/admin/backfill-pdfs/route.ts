import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllAbrechnungen, getBelege } from '@/lib/data';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || payload.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [alleAbrechnungen, alleBelege] = await Promise.all([
        getAllAbrechnungen(),
        getBelege(),
    ]);

    const bezahlteAbrechnungen = alleAbrechnungen.filter((a: any) => a.status === 'bezahlt');
    const bezahlteBelege = alleBelege.filter(b => b.status === 'bezahlt');

    return NextResponse.json({ abrechnungen: bezahlteAbrechnungen, belege: bezahlteBelege });
}
