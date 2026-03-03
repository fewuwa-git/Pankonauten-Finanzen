import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminClient from '@/components/AdminClient';

export default async function AdminPage() {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const role = headersList.get('x-user-role') as 'admin' | 'member' | 'eltern' | 'springerin' | null;
    const name = headersList.get('x-user-name') || '';
    const email = headersList.get('x-user-email') || '';

    if (!userId || !role) redirect('/login');

    return (
        <AdminClient currentUser={{ name, email, role }} />
    );
}
