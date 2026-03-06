import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/db';
import { getTransactions } from '@/lib/data';

const BUCKET = 'transaction-receipts';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Load receipt metadata
        const { data: receipt } = await supabase
            .from('pankonauten_transaction_receipts')
            .select('file_path, file_name')
            .eq('id', id)
            .single();

        if (!receipt) return NextResponse.json({ error: 'Beleg nicht gefunden' }, { status: 404 });

        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from(BUCKET)
            .download(receipt.file_path);

        if (downloadError || !fileData) {
            return NextResponse.json({ error: 'Datei konnte nicht geladen werden' }, { status: 500 });
        }

        // Load transactions (last 200, newest first – keep prompt short)
        const allTransactions = await getTransactions();
        const transactions = [...allTransactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 200);

        const txList = transactions.map(t =>
            `${t.id} | ${t.date} | ${t.counterparty} | ${t.description} | ${t.amount}€`
        ).join('\n');

        // Prepare file for Gemini
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = receipt.file_name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/webp';

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
        });

        const prompt = `Analysiere diesen Beleg und finde passende Buchungen.

Extrahiere: Aussteller, Betrag, Datum, Beschreibung.

Buchungen (ID | Datum | Gegenüber | Beschreibung | Betrag):
${txList}

Antworte NUR mit JSON (kein Markdown):
{"extracted":{"vendor":"...","amount":0.00,"date":"YYYY-MM-DD","description":"..."},"suggestions":[{"transaction_id":"...","confidence":0.9,"reason":"..."}]}

Top 3 Treffer, confidence zwischen 0 und 1.`;

        const result = await model.generateContent([
            { inlineData: { mimeType, data: base64 } },
            prompt,
        ]);

        const text = result.response.text().trim();
        const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

        let parsed: { extracted: object; suggestions: { transaction_id: string; confidence: number; reason: string }[] };
        try {
            parsed = JSON.parse(clean);
        } catch {
            return NextResponse.json({ error: 'KI-Antwort konnte nicht verarbeitet werden', raw: text }, { status: 500 });
        }

        // Enrich suggestions with full transaction data
        const txMap = new Map(transactions.map(t => [t.id, t]));
        const enriched = (parsed.suggestions || [])
            .map(s => {
                const tx = txMap.get(s.transaction_id);
                if (!tx) return null;
                return { ...s, transaction: tx };
            })
            .filter(Boolean);

        return NextResponse.json({ extracted: parsed.extracted, suggestions: enriched });

    } catch (err: any) {
        console.error('Suggest error:', err);
        return NextResponse.json({ error: err?.message ?? 'Unbekannter Fehler' }, { status: 500 });
    }
}
