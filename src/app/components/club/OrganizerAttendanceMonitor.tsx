import React, { useEffect, useState } from 'react';
import { Users, Loader2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchEventAttendance, AttendanceRecord } from '../../services/attendanceApi';
import { toast } from 'sonner';

interface OrganizerAttendanceMonitorProps {
    eventId: string;
    clubId: string;
    eventTitle: string;
    onRefresh?: () => void;
}

export const OrganizerAttendanceMonitor: React.FC<OrganizerAttendanceMonitorProps> = ({
    eventId,
    clubId,
    eventTitle,
    onRefresh,
}) => {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchEventAttendance(eventId, clubId);
            setAttendance(data.attendance || []);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message);
            toast.error('Failed to load attendance');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [eventId]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchAttendance();
        }, 5000); // Refresh every 5 seconds

        return () => clearInterval(interval);
    }, [eventId, autoRefresh]);

    const handleManualRefresh = () => {
        fetchAttendance();
        onRefresh?.();
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Live Attendance</h3>
                        <p className="text-xs text-gray-500">{eventTitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded w-4 h-4"
                        />
                        <span className="text-gray-700">Auto-refresh</span>
                    </label>
                    <button
                        onClick={handleManualRefresh}
                        disabled={loading}
                        className="p-2 hover:bg-gray-100 rounded-xl transition disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-red-800">{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && attendance.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
            )}

            {/* Stats Bar */}
            {!loading && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{attendance.length}</div>
                        <div className="text-xs text-gray-600">Attendance</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                        <div className="text-2xl font-bold text-emerald-600">
                            {attendance.reduce((sum, a) => sum + (a.cca_hours_awarded || 0), 0)}
                        </div>
                        <div className="text-xs text-gray-600">Total CCA Hrs</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {attendance.length > 0 ? (attendance.reduce((sum, a) => sum + (a.cca_hours_awarded || 0), 0) / attendance.length).toFixed(1) : '0'}
                        </div>
                        <div className="text-xs text-gray-600">Avg hrs/person</div>
                    </div>
                    {lastUpdated && (
                        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                            <div className="text-xs text-gray-700 font-mono">
                                {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-600">Last updated</div>
                        </div>
                    )}
                </div>
            )}

            {/* Attendee List */}
            {!loading && attendance.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {attendance.map((record, idx) => (
                        <div
                            key={record._id || idx}
                            className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{record.student_name}</h4>
                                    <p className="text-xs text-gray-600">{record.student_roll_no}</p>
                                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                        <Clock size={12} />
                                        {new Date(record.checked_in_at).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                        })}
                                    </div>
                                </div>
                                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
                                    <div className="text-lg font-bold text-emerald-600">{record.cca_hours_awarded}</div>
                                    <div className="text-xs font-medium text-emerald-700">hrs</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && attendance.length === 0 && !error && (
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                    <h4 className="font-semibold text-gray-600">No attendees yet</h4>
                    <p className="text-sm text-gray-500">Attendees will appear here as they check in</p>
                </div>
            )}
        </div>
    );
};
