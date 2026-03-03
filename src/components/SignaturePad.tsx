'use client';

import { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
    existing?: string | null;
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

export default function SignaturePad({ existing, onSave, onCancel }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ('touches' in e) {
            const t = e.touches[0];
            return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawing.current = true;
        lastPos.current = getPos(e, canvas);
        setIsEmpty(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!drawing.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx || !lastPos.current) return;
        const pos = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    };

    const stopDraw = () => {
        drawing.current = false;
        lastPos.current = null;
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onSave(canvas.toDataURL('image/png'));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {existing && (
                <div style={{ marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Aktuelle Unterschrift:</div>
                    <img src={existing} alt="Unterschrift" style={{ maxHeight: '60px', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px', background: '#fff' }} />
                </div>
            )}
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Unterschreibe mit Maus, Trackpad oder Finger:
            </div>
            <canvas
                ref={canvasRef}
                width={600}
                height={200}
                style={{
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    touchAction: 'none',
                    cursor: 'crosshair',
                    width: '100%',
                    height: '160px',
                    background: '#fff',
                }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>Leeren</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Abbrechen</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={isEmpty}>Unterschrift speichern</button>
            </div>
        </div>
    );
}
