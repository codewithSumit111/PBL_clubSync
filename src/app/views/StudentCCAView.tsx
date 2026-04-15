import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { CCAProgressBar } from '../components/student/CCAProgressBar';
import { JoinedClubsWidget } from '../components/student/JoinedClubsWidget';
import { fetchStudentDashboard, StudentDashboardData } from '../services/studentApi';
import { Award, Target, Info, ShieldCheck, RefreshCw } from 'lucide-react';

export const StudentCCAView: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fetchStudentDashboard();
            setData(result);
        } catch (error) {
            console.error('Error fetching CCA data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

        // Only 1st year students should access CCA view
        if (user?.year !== '1') {
            return (
                <div className="flex flex-col items-center justify-center h-[70vh]">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                        <ShieldCheck size={32} className="text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">CCA Requirement Completed</h2>
                    <p className="text-gray-600 text-center mb-6 max-w-md">
                        You've completed your CCA requirements! This section is only for 1st year students who are still accumulating CCA hours.
                    </p>
                </div>
            );
        }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-teal-200">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Your CCA Progress</h2>
                        <p className="text-gray-500">Detailed breakdown of your hours and performance rubrics.</p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Sync Data
                </button>
            </div>

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-teal-600">
                        <Target size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Mandate Status</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {data?.ccaProgress?.percentage || 0}% Complete
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {data?.ccaProgress?.completed || 0} of {data?.ccaProgress?.mandated || 30} hours earned
                    </p>
                </div>

                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-purple-600">
                        <Award size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Performance Score</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {data?.ccaProgress?.totalMarks || 0} Points
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        Average across {data?.joinedClubs?.length || 0} clubs
                    </p>
                </div>

                <div className="bg-white px-6 py-4 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/30 to-transparent flex items-start gap-4">
                    <Info className="text-teal-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                        <h4 className="font-bold text-teal-900 text-sm">Pro Tip</h4>
                        <p className="text-xs text-teal-700 leading-relaxed mt-1">
                            Regularly submit logbooks after your activities to reach your mandate faster. Rubric marks are updated monthly by Club Leads.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Progress Tracker */}
            <div className="grid grid-cols-1 gap-8">
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Mandate Tracker</h3>
                    <CCAProgressBar 
                        progress={data?.ccaProgress || { completed: 0, mandated: 30, percentage: 0 }} 
                        loading={loading} 
                    />
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Club-wise Rubric Breakdown</h3>
                    <JoinedClubsWidget clubs={data?.joinedClubs || []} loading={loading} />
                </section>
            </div>
        </div>
    );
};
