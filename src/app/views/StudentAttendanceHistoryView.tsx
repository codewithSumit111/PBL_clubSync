import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Award, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchStudentAttendanceHistory, StudentAttendanceHistory } from '../services/attendanceApi';

export const StudentAttendanceHistoryView: React.FC = () => {
    const [attendance, setAttendance] = useState<StudentAttendanceHistory[]>([]);
    const [totalHours, setTotalHours] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAttendanceHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchStudentAttendanceHistory();
                setAttendance(data.attendance);
                setTotalHours(data.total_cca_hours);
            } catch (err: any) {
                setError(err.message);
                toast.error('Failed to load attendance history');
            } finally {
                setLoading(false);
            }
        };

        loadAttendanceHistory();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-xl shadow-teal-100/40 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-200">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">My Check-In History</h2>
                        <p className="text-sm text-gray-500">Track your event attendance and earned CCA hours.</p>
                    </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 flex items-center gap-2">
                    <Award size={18} className="text-emerald-600" /> {totalHours} CCA hrs earned
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
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
            )}

            {/* Empty State */}
            {!loading && attendance.length === 0 && !error && (
                <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
                    <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-600">No check-ins yet</h3>
                    <p className="text-sm text-gray-500">Start scanning QR codes at club events to see them here.</p>
                </div>
            )}

            {/* Attendance List */}
            {!loading && attendance.length > 0 && (
                <div className="space-y-3">
                    {attendance.map((record) => (
                        <div
                            key={record._id}
                            className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md backdrop-blur-xl transition-all hover:shadow-lg hover:border-teal-200"
                        >
                            <div className="flex items-start justify-between gap-4 md:items-center">
                                <div className="flex-1">
                                    <h3 className="mb-1 text-lg font-semibold text-gray-900">{record.event_title}</h3>
                                    <p className="mb-3 text-sm text-gray-600">{record.club_name}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Calendar size={16} className="text-teal-600" />
                                            {record.checked_in_date}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Clock size={16} className="text-teal-600" />
                                            {record.checked_in_time}
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-teal-50 px-4 py-2 text-right">
                                    <div className="text-2xl font-bold text-teal-600">
                                        {record.cca_hours_awarded}
                                    </div>
                                    <div className="text-xs font-medium text-teal-700">CCA hrs</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary Stats */}
            {!loading && attendance.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
                        <div className="mb-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Check-ins</div>
                        <div className="text-3xl font-bold text-teal-600">{attendance.length}</div>
                    </div>
                    <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
                        <div className="mb-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">Total CCA Hours</div>
                        <div className="text-3xl font-bold text-emerald-600">{totalHours}</div>
                    </div>
                    <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
                        <div className="mb-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Hours/Event</div>
                        <div className="text-3xl font-bold text-blue-600">
                            {(totalHours / attendance.length).toFixed(1)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
