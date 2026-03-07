const DATE_OPTS: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: '2-digit' };
const DATETIME_OPTS: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' };

/** "04.03.26" */
export function fmtDate(value: string | Date): string {
    return new Date(value).toLocaleDateString('de-DE', DATE_OPTS);
}

/** "04.03.26, 14:30" */
export function fmtDateTime(value: string | Date): string {
    return new Date(value).toLocaleDateString('de-DE', DATETIME_OPTS);
}
