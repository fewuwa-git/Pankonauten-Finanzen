export interface ChangelogEntry {
    date: string;
    changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        date: '03.03.2026',
        changes: [
            'Unterschrift-Funktion: Springerinnen, Eltern und Vorstandsmitglieder können ihre Unterschrift per Maus, Trackpad oder Touch hinterlegen',
            'Adressfelder (Straße + Hausnummer, PLZ + Ort) jetzt auch für Eltern- und Vorstandsmitglieder-Accounts bearbeitbar',
            'Abrechnung: Neuer Statusfilter (Entwurf / Eingereicht / Bezahlt) neben den bestehenden Filtern',
            'PDF-Öffnung in Safari: Popup-Blockierung umgangen – PDFs öffnen jetzt zuverlässig in einem neuen Tab',
            'Sidebar: Menüpunkt „Eltern-Buchungen" heißt jetzt „Meine Buchungen"',
        ],
    },
    {
    {
        date: '03.03.2026',
        changes: [
            'Eltern-Accounts können sich jetzt einloggen und sehen ihre Buchungen sowie ihr Benutzerprofil',
            'Neue Seite „Eltern-Buchungen": Eltern sehen nur ihre eigenen Buchungen, Admins können per Dropdown zwischen allen Eltern-Accounts wechseln',
            'Neuer Sidebar-Bereich „Eltern" mit Link zu Eltern-Buchungen (sichtbar für Eltern, Vorstandsmitglieder und Admins)',
        ],
    },
    {
        date: '03.03.2026',
        changes: [
            'Automatischer Logout nach 24 Stunden Inaktivität – wer aktiv ist, bleibt eingeloggt',
            'Favicon: Das Pankonauten-Logo erscheint jetzt im Browser-Tab',
            'Login-Seite: Passwortfeld wird beim Klick geleert, damit Autofill-Punkte nicht verwirren',
            'Login-Seite: Überflüssige Überschrift „Willkommen zurück" entfernt',
            'Performance: Alle Seiten laden deutlich schneller – Inhalte erscheinen stufenweise statt alles auf einmal zu warten',
            'Performance: Lade-Skeleton (pulsierende Platzhalter) zeigt sofort die Seitenstruktur beim Navigieren',
            'Sicherheit: Globaler Zugriffsschutz für alle Seiten über zentrales Middleware',
        ],
    },
];
