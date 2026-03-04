'use client';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmClass?: string;
    isLoading?: boolean;
    checkboxLabel?: string;
    checkboxChecked?: boolean;
    onCheckboxChange?: (checked: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel,
    confirmClass = 'btn-primary',
    isLoading = false,
    checkboxLabel,
    checkboxChecked,
    onCheckboxChange,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'left' }}>
                <div className="modal-title">{title}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: checkboxLabel ? '16px' : '24px', lineHeight: '1.6' }}>
                    {message}
                </p>
                {checkboxLabel && onCheckboxChange && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '24px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={checkboxChecked ?? false}
                            onChange={e => onCheckboxChange(e.target.checked)}
                        />
                        {checkboxLabel}
                    </label>
                )}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Abbrechen
                    </button>
                    <button
                        className={`btn ${confirmClass}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Bitte warten...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
