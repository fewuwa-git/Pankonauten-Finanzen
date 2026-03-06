import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/db';
import { getTransactions } from '@/lib/data';

const BUCKET = 'transaction-receipts';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Load transactions (last 500, newest first)
    const allTransactions = await getTransactions();
    const transactions = [...allTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 500);

    const txList = transactions.map(t =>
        `ID:${t.id} | ${t.date} | ${t.counterparty} | ${t.description} | ${t.amount > 0 ? '+' : ''}${t.amount}€ | ${t.category}`
    ).join('\n');

    // Prepare file for Gemini
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = receipt.file_name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/webp';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Du bist ein Buchhalter-Assistent. Analysiere den beigefügten Beleg und finde die passendsten Buchungen aus der folgenden Liste.

Extrahiere aus dem Beleg:
- Rechnungssteller / Absender
- Betrag
- Datum
- Verwendungszweck / Beschreibung

Hier sind die verfügbaren Buchungen (Format: ID | Datum | Gegenüber | Beschreibung | Betrag | Kategorie):
${txList}

Gib die Top 3 passendsten Buchungen zurück. Antworte NUR mit gültigem JSON in diesem Format, ohne Markdown-Code-Blöcke:
{
  "extracted": {
    "vendor": "Name des Rechnungsstellers",
    "amount": 12.34,
    "date": "2026-01-15",
    "description": "Kurze Beschreibung"
  },
  "suggestions": [
    {
      "transaction_id": "die-uuid-hier",
      "confidence": 0.95,
      "reason": "Kurze Begründung auf Deutsch"
    }
  ]
}`;

    const result = await model.generateContent([
        { inlineData: { mimeType, data: base64 } },
        prompt,
    ]);

    const text = result.response.text().trim();

    let parsed: { extracted: object; suggestions: { transaction_id: string; confidence: number; reason: string }[] };
    try {
        const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
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
}
