import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await getTransactions();
    return NextResponse.json(transactions);
}
