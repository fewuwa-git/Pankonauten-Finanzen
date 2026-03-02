'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';

interface DeleteAbrechnungButtonProps {
    id: string;
    label: string;
}

export default function DeleteAbrechnungButton({ id, label }: DeleteAbrechnungButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/abrechnungen?id=${id}`, { method: 'DELETE' });

            if (res.ok) {
                setShowModal(false);
                router.refresh();
            } else {
                const errorData = await res.json();
                alert(`Fehler beim Löschen: ${errorData.error || 'Unbekannter Fehler'}`);
            }
        } catch (error) {
            console.error('Error deleting abrechnung:', error);
            alert('Ein Netzwerkfehler ist aufgetreten.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="btn btn-sm btn-danger"
                style={{ padding: '4px 10px' }}
                title="Abrechnung löschen"
            >
                Löschen
            </button>
            <ConfirmModal
                isOpen={showModal}
                title="Abrechnung löschen"
                message={`Möchtest du die Abrechnung „${label}" wirklich unwiderruflich löschen?`}
                confirmLabel="Ja, löschen"
                confirmClass="btn-danger"
                isLoading={isDeleting}
                onConfirm={handleConfirm}
                onCancel={() => setShowModal(false)}
            />
        </>
    );
}
