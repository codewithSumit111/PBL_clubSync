import React from 'react';
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-white/60">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 mb-3">
                            <QrCode size={14} /> Event QR
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {event.time ? ` · ${event.time}` : ''}
                            {event.venue ? ` · ${event.venue}` : ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
                    <div className="rounded-2xl bg-white p-4 shadow-lg shadow-teal-100">
                        <QRCodeCanvas value={qrToken} size={240} includeMargin level="M" />
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
    );
};