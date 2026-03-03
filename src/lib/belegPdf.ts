import jsPDF from 'jspdf';
import { Beleg } from './data';

// ─── Betrag in deutsche Wörter ────────────────────────────────────────────────
const EINER = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun',
    'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const ZEHNER = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

function hundert(n: number): string {
    if (n === 0) return '';
    if (n < 20) return EINER[n];
    const z = Math.floor(n / 10);
    const e = n % 10;
    return e === 0 ? ZEHNER[z] : `${EINER[e]}und${ZEHNER[z]}`;
}

function dreisteller(n: number): string {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return (h > 0 ? `${EINER[h]}hundert` : '') + hundert(rest);
}

export function euroInWorte(betrag: number): string {
    const gerundet = Math.round(betrag * 100) / 100;
    const euro = Math.floor(gerundet);
    const cent = Math.round((gerundet - euro) * 100);

    let wort = '';
    if (euro >= 1000) {
        const t = Math.floor(euro / 1000);
        wort += `${dreisteller(t)}tausend`;
    }
    wort += dreisteller(euro % 1000);
    if (wort === '') wort = 'null';

    const euroWort = wort + (euro === 1 ? ' Euro' : ' Euro');
    if (cent === 0) return euroWort;
    return `${euroWort} und ${hundert(cent)} Cent`;
}

// ─── PDF generieren ───────────────────────────────────────────────────────────
export async function generateBelegPDF(beleg: Beleg): Promise<string> {
    const doc = new jsPDF({ format: 'a5', orientation: 'portrait' });
    const W = doc.internal.pageSize.getWidth();
    const margin = 14;
    const col = W - margin * 2;

    const NAVY: [number, number, number] = [26, 46, 69];
    const MUTED: [number, number, number] = [107, 114, 128];
    const BORDER: [number, number, number] = [200, 203, 207];
    const YELLOW: [number, number, number] = [254, 203, 47];

    const user = beleg.pankonauten_users;
    const brutto = beleg.betrag;
    const netto = beleg.netto;
    const mwstSatz = beleg.mwst_satz;
    const mwstBetrag = Math.round((brutto - netto) * 100) / 100;
    const hatMwst = mwstSatz > 0;
    const betragFuerWorte = hatMwst ? brutto : netto;

    // ─── Akzentlinie oben ────────────────────────────────────────────────────
    doc.setFillColor(YELLOW[0], YELLOW[1], YELLOW[2]);
    doc.rect(0, 0, W, 4, 'F');

    // ─── Titel ───────────────────────────────────────────────────────────────
    let y = 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('Quittung', margin, y);

    // Belegnummer rechts
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`Nr. ${beleg.belegnummer || '–'}`, W - margin, y, { align: 'right' });

    y += 3;
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y, W - margin, y);

    // ─── Empfangen von ───────────────────────────────────────────────────────
    y += 6;
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('EMPFANGEN VON', margin, y);

    y += 4;
    doc.setFontSize(10);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(user?.name || '–', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (user?.strasse) { doc.text(user.strasse, margin, y); y += 4.5; }
    if (user?.ort)     { doc.text(user.ort, margin, y);     y += 4.5; }

    // ─── Betrag in Zahlen ────────────────────────────────────────────────────
    y += 3;
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setFillColor(245, 246, 248);
    doc.roundedRect(margin, y, col, hatMwst ? 26 : 16, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('BETRAG', margin + 4, y + 5);

    doc.setFontSize(10);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Netto:', margin + 4, y + 11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${netto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`, W - margin - 4, y + 11, { align: 'right' });

    if (hatMwst) {
        doc.setFont('helvetica', 'normal');
        doc.text(`zzgl. ${mwstSatz}% MwSt.:`, margin + 4, y + 17);
        doc.setFont('helvetica', 'bold');
        doc.text(`${mwstBetrag.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`, W - margin - 4, y + 17, { align: 'right' });

        doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
        doc.line(margin + 4, y + 19, W - margin - 4, y + 19);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.text('Brutto:', margin + 4, y + 25);
        doc.text(`${brutto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`, W - margin - 4, y + 25, { align: 'right' });

        y += 26;
    } else {
        y += 16;
    }

    // ─── Betrag in Worten ────────────────────────────────────────────────────
    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('BETRAG IN WORTEN', margin, y);
    y += 4;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    const worte = euroInWorte(betragFuerWorte);
    const worteLines = doc.splitTextToSize(worte.charAt(0).toUpperCase() + worte.slice(1), col);
    doc.text(worteLines, margin, y);
    y += worteLines.length * 5;

    // ─── Für ─────────────────────────────────────────────────────────────────
    y += 3;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('FÜR', margin, y);
    y += 4;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    const fuerLines = doc.splitTextToSize(beleg.titel + (beleg.beschreibung ? '\n' + beleg.beschreibung : ''), col);
    doc.text(fuerLines, margin, y);
    y += fuerLines.length * 5;

    // ─── Zu Gunsten / Lasten ─────────────────────────────────────────────────
    y += 3;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('ZU GUNSTEN / LASTEN VON', margin, y);
    y += 4;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('Pankonauten e.V.', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Ravenéstraße 10, 13347 Berlin', margin, y);
    y += 6;

    // ─── Trennlinie ──────────────────────────────────────────────────────────
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y, W - margin, y);
    y += 6;

    // ─── Ort / Datum + Unterschrift (nebeneinander) ───────────────────────────
    const halfCol = (col - 10) / 2;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('ORT / DATUM', margin, y);
    doc.text('UNTERSCHRIFT', margin + halfCol + 10, y);

    y += 4;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    const datumFormatiert = new Date(beleg.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(`Berlin, ${datumFormatiert}`, margin, y);

    // Unterschrift
    if (user?.unterschrift) {
        try {
            const img = new Image();
            img.src = user.unterschrift;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            const maxH = 18;
            const maxW = halfCol;
            const ratio = img.width / img.height;
            let dW = maxH * ratio;
            let dH = maxH;
            if (dW > maxW) { dW = maxW; dH = dW / ratio; }
            doc.addImage(img, 'PNG', margin + halfCol + 10, y - 4, dW, dH);
        } catch { /* leer lassen */ }
    }

    // Linien unter Ort/Datum und Unterschrift
    const lineY = y + 16;
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, lineY, margin + halfCol, lineY);
    doc.line(margin + halfCol + 10, lineY, W - margin, lineY);

    // Name unter Unterschrift-Linie
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(user?.name || '', margin + halfCol + 10, lineY + 4);

    // ─── Footer ──────────────────────────────────────────────────────────────
    const fY = doc.internal.pageSize.getHeight() - 6;
    doc.setFontSize(7);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('Pankonauten e.V. · Ravenéstr. 10 · 13347 Berlin', W / 2, fY, { align: 'center' });

    return URL.createObjectURL(doc.output('blob'));
}
