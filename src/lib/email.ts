import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'finanzen@pankonauten.de';

export async function sendInviteEmail(to: string, name: string, inviteUrl: string): Promise<void> {
    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: 'Einladung zum Pankonauten-Finanzportal',
        html: `
            <p>Hallo ${name},</p>
            <p>du wurdest zum Pankonauten-Finanzportal eingeladen.</p>
            <p>Klicke auf den folgenden Link, um dein Passwort zu setzen und deinen Account zu aktivieren:</p>
            <p><a href="${inviteUrl}" style="background:#1a3a5c;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Einladung annehmen</a></p>
            <p style="color:#666;font-size:13px;">Der Link ist 7 Tage gültig. Falls du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.</p>
        `,
    });
    if (error) {
        throw new Error('E-Mail konnte nicht gesendet werden: ' + error.message);
    }
}

export async function sendApprovalEmail(to: string, name: string, loginUrl: string): Promise<void> {
    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: 'Dein Account wurde freigeschaltet – Pankonauten Finanzen',
        html: `
            <p>Hallo ${name},</p>
            <p>dein Account im Pankonauten-Finanzportal wurde freigeschaltet. Du kannst dich jetzt einloggen:</p>
            <p><a href="${loginUrl}" style="background:#1a3a5c;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Zum Login</a></p>
        `,
    });
    if (error) {
        throw new Error('E-Mail konnte nicht gesendet werden: ' + error.message);
    }
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: 'Passwort zurücksetzen – Pankonauten Finanzen',
        html: `
            <p>Hallo ${name},</p>
            <p>du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
            <p>Klicke auf den folgenden Link, um ein neues Passwort zu setzen:</p>
            <p><a href="${resetUrl}" style="background:#1a3a5c;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Passwort zurücksetzen</a></p>
            <p style="color:#666;font-size:13px;">Der Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
        `,
    });
    if (error) {
        throw new Error('E-Mail konnte nicht gesendet werden: ' + error.message);
    }
}
