import React from 'react';
import { createPortal } from 'react-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceEvent } from '../../services/attendanceApi';

interface EventQrModalProps {
    event: AttendanceEvent;
    qrToken: string;
    onClose: () => void;
}

export const EventQrModal: React.FC<EventQrModalProps> = ({ event, qrToken, onClose }) => {
    const copyToken = async () => {
        await navigator.clipboard.writeText(qrToken);
        toast.success('QR token copied');
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div className="w-full max-w-sm rounded-3xl bg-white overflow-hidden animate-fade-in-up"
                style={{ boxShadow: '0 32px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="h-1 w-full bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-400" />
                <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 mb-2">
                                <QrCode size={14} /> Event QR
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {event.time ? ` · ${event.time}` : ''}
                                {event.venue ? ` · ${event.venue}` : ''}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 p-5">
                        <div className="rounded-2xl bg-white p-3 shadow-lg shadow-teal-100">
                            <QRCodeCanvas value={qrToken} size={200} includeMargin level="M" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-900">{event.club_name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                                CCA Hours: {event.cca_hours || 0}
                            </p>
                        </div>
                        <button
                            onClick={copyToken}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50"
                        >
                            <Copy size={14} /> Copy QR Token
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};