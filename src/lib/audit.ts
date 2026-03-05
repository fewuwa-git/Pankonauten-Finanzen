import { supabase } from './db';

export type AuditAction =
    | 'beleg_erstellt'
    | 'beleg_eingereicht'
    | 'beleg_bezahlt'
    | 'beleg_abgelehnt'
    | 'abrechnung_erstellt'
    | 'abrechnung_eingereicht'
    | 'abrechnung_bezahlt'
    | 'csv_import';

export const AUDIT_LABELS: Record<AuditAction, string> = {
    beleg_erstellt: 'Beleg erstellt',
    beleg_eingereicht: 'Beleg eingereicht',
    beleg_bezahlt: 'Beleg bezahlt',
    beleg_abgelehnt: 'Beleg abgelehnt',
    abrechnung_erstellt: 'Abrechnung erstellt',
    abrechnung_eingereicht: 'Abrechnung eingereicht',
    abrechnung_bezahlt: 'Abrechnung bezahlt',
    csv_import: 'CSV-Import',
};

export interface AuditLogEntry {
    id: string;
    user_id: string;
    user_name: string;
    action: AuditAction;
    details: Record<string, unknown> | null;
    created_at: string;
}

export async function logAudit(
    userId: string,
    userName: string,
    action: AuditAction,
    details?: Record<string, unknown>
) {
    await supabase.from('audit_log').insert({
        user_id: userId,
        user_name: userName,
        action,
        details: details ?? null,
    });
}

export async function getAuditLog(limit = 300): Promise<AuditLogEntry[]> {
    const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    return (data ?? []) as AuditLogEntry[];
}
