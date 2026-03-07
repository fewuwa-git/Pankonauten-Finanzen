import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { getKiSettings } from '@/lib/kiSettings';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || payload.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getKiSettings();

    // Mask the API key – only return whether it's set and last 4 chars
    const maskedKey = settings.apiKey
        ? `${'•'.repeat(Math.max(0, settings.apiKey.length - 4))}${settings.apiKey.slice(-4)}`
        : '';

    return NextResponse.json({ ...settings, apiKey: maskedKey, apiKeySet: !!settings.apiKey });
}

export async function PATCH(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || payload.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const upserts: { key: string; value: string }[] = [];

    if (body.apiKey !== undefined && body.apiKey !== '' && !body.apiKey.startsWith('•')) {
        upserts.push({ key: 'ki_api_key', value: body.apiKey });
    }
    if (body.extractModel !== undefined) upserts.push({ key: 'ki_extract_model', value: body.extractModel });
    if (body.matchModel !== undefined) upserts.push({ key: 'ki_match_model', value: body.matchModel });
    if (body.fallbackModel !== undefined) upserts.push({ key: 'ki_fallback_model', value: body.fallbackModel });
    if (body.timeWindowDays !== undefined) upserts.push({ key: 'ki_time_window_days', value: String(body.timeWindowDays) });
    if (body.maxTransactions !== undefined) upserts.push({ key: 'ki_max_transactions', value: String(body.maxTransactions) });
    if (body.autoAssign !== undefined) upserts.push({ key: 'ki_auto_assign', value: String(body.autoAssign) });
    if (body.autoAssignThreshold !== undefined) upserts.push({ key: 'ki_auto_assign_threshold', value: String(body.autoAssignThreshold) });

    if (upserts.length > 0) {
        const { error } = await supabase
            .from('pankonauten_settings')
            .upsert(upserts, { onConflict: 'key' });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
