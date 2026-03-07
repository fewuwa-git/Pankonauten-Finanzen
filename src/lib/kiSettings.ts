import { supabase } from '@/lib/db';

export interface KiSettings {
    apiKey?: string;
    extractModel: string;
    matchModel: string;
    fallbackModel: string;
    timeWindowDays: number;
    maxTransactions: number;
    autoAssign: boolean;
    autoAssignThreshold: number;
}

const DEFAULTS: KiSettings = {
    extractModel: 'gemini-2.5-flash',
    matchModel: 'gemini-2.5-flash',
    fallbackModel: 'gemini-2.0-flash',
    timeWindowDays: 60,
    maxTransactions: 300,
    autoAssign: false,
    autoAssignThreshold: 99,
};

const KI_KEYS = [
    'ki_api_key',
    'ki_extract_model',
    'ki_match_model',
    'ki_fallback_model',
    'ki_time_window_days',
    'ki_max_transactions',
    'ki_auto_assign',
    'ki_auto_assign_threshold',
] as const;

export async function getKiSettings(): Promise<KiSettings> {
    const { data } = await supabase
        .from('pankonauten_settings')
        .select('key, value')
        .in('key', KI_KEYS as unknown as string[]);

    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;

    return {
        apiKey: map['ki_api_key'] || undefined,
        extractModel: map['ki_extract_model'] || DEFAULTS.extractModel,
        matchModel: map['ki_match_model'] || DEFAULTS.matchModel,
        fallbackModel: map['ki_fallback_model'] || DEFAULTS.fallbackModel,
        timeWindowDays: map['ki_time_window_days'] ? parseInt(map['ki_time_window_days']) : DEFAULTS.timeWindowDays,
        maxTransactions: map['ki_max_transactions'] ? parseInt(map['ki_max_transactions']) : DEFAULTS.maxTransactions,
        autoAssign: map['ki_auto_assign'] === 'true',
        autoAssignThreshold: map['ki_auto_assign_threshold'] ? parseInt(map['ki_auto_assign_threshold']) : DEFAULTS.autoAssignThreshold,
    };
}
