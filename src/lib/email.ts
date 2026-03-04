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
