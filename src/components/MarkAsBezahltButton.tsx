'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';

interface MarkAsBezahltButtonProps {
    id: string;
    label: string;
    targetStatus: 'eingereicht' | 'bezahlt';
}

export default function MarkAsBezahltButton({ id, label, targetStatus }: MarkAsBezahltButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sendEmail, setSendEmail] = useState(true);
    const router = useRouter();

    const isBezahlt = targetStatus === 'bezahlt';
    const buttonLabel = isBezahlt ? '✅ Bezahlt' : '📤 Einreichen';
    const btnClass = isBezahlt ? 'btn btn-sm btn-success' : 'btn btn-sm btn-primary';

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/abrechnungen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', id, status: targetStatus, sendEmail: isBezahlt ? sendEmail : false }),
            });

            if (res.ok) {
                setShowModal(false);
                router.refresh();
            } else {
                const errorData = await res.json();
                alert(`Fehler: ${errorData.error || 'Unbekannter Fehler'}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Ein Netzwerkfehler ist aufgetreten.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={btnClass}
                style={{ padding: '4px 10px' }}
            >
                {buttonLabel}
            </button>
            <ConfirmModal
                isOpen={showModal}
                title={isBezahlt ? 'Als bezahlt markieren' : 'Abrechnung einreichen'}
                message={isBezahlt
                    ? `Möchtest du die Abrechnung von „${label}" wirklich als bezahlt markieren?`
                    : `Möchtest du die Abrechnung von „${label}" als eingereicht markieren?`}
                confirmLabel={isBezahlt ? '✅ Ja, als bezahlt markieren' : '📤 Ja, einreichen'}
                confirmClass={isBezahlt ? 'btn-success' : 'btn-primary'}
                isLoading={isLoading}
                checkboxLabel={isBezahlt ? 'Bezahlt-E-Mail an die Springerin senden' : undefined}
                checkboxChecked={isBezahlt ? sendEmail : undefined}
                onCheckboxChange={isBezahlt ? setSendEmail : undefined}
                onConfirm={handleConfirm}
                onCancel={() => setShowModal(false)}
            />
        </>
    );
}
