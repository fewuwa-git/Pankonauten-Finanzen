'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface User {
    id: string;
    name: string;
}

interface ElternUserSelectorProps {
    users: User[];
    selectedUserId?: string;
}

export default function ElternUserSelector({ users, selectedUserId }: ElternUserSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
            params.set('userId', e.target.value);
        } else {
            params.delete('userId');
        }
        router.push(`/eltern/buchungen?${params.toString()}`);
    }

    return (
        <div className="card mb-6">
            <div className="card-header" style={{ paddingBottom: '16px' }}>
                <div className="card-title">👤 Eltern-Account auswählen</div>
                <select
                    className="form-input"
                    style={{ maxWidth: '300px', padding: '8px 12px' }}
                    value={selectedUserId || ''}
                    onChange={handleChange}
                >
                    <option value="">– Bitte auswählen –</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
