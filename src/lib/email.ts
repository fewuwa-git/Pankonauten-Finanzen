import { Resend } from 'resend';
import { getEmailTemplate } from './data';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'finanzen@pankonauten.de';

function renderTemplate(body: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce(
        (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
        body
    );
}

async function sendEmail(templateId: string, to: string, vars: Record<string, string>): Promise<void> {
    const template = await getEmailTemplate(templateId);
    if (!template) throw new Error(`E-Mail-Template "${templateId}" nicht gefunden`);

    const subject = renderTemplate(template.subject, vars);
    const html = renderTemplate(template.body, vars);

    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) throw new Error('E-Mail konnte nicht gesendet werden: ' + error.message);
}

export async function sendInviteEmail(to: string, name: string, inviteUrl: string): Promise<void> {
    await sendEmail('invite', to, { name, url: inviteUrl });
}

export async function sendApprovalEmail(to: string, name: string, loginUrl: string): Promise<void> {
    await sendEmail('approval', to, { name, url: loginUrl });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
    await sendEmail('password_reset', to, { name, url: resetUrl });
}
