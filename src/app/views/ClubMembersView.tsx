import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Users, Clock3, CheckCircle2, XCircle, Loader2, AlertCircle, Mail, Hash, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('clubsync_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface StudentMember {
  _id: string;
  name: string;
  roll_no: string;
  department: string;
  year: string;
  email: string;
  registered_clubs: {
    club: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    preference_order: number;
  }[];
}

export const ClubMembersView: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [students, setStudents] = useState<StudentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved'>('Pending');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/clubs/members`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      } else {
        toast.error(data.message || 'Failed to fetching members');
      }
    } catch (err) {
      toast.error('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Club') {
      fetchMembers();
    }
  }, [user]);

  const handleAction = async (studentId: string, status: 'Approved' | 'Rejected') => {
    setProcessingId(studentId);
    try {
      const res = await fetch(`${API_BASE}/clubs/applications/${studentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Application ${status.toLowerCase()}`);
        setStudents(prev => prev.map(s => {
          if (s._id === studentId) {
            return {
              ...s,
              registered_clubs: s.registered_clubs.map(rc => 
                rc.club === user?.id ? { ...rc, status } : rc
              )
            };
          }
          return s;
        }));
      } else {
        toast.error(data.message || `Failed to ${status.toLowerCase()} application`);
      }
    } catch (err) {
      toast.error('Network error while processing application');
    } finally {
      setProcessingId(null);
    }
  };

  // Find the status of the student for THIS club
  const getStudentStatus = (s: StudentMember) => {
    const rc = s.registered_clubs.find(c => c.club === user?.id);
    return rc?.status || 'Pending';
  };

  const pendingStudents = students.filter(s => getStudentStatus(s) === 'Pending');
  const activeMembers = students.filter(s => getStudentStatus(s) === 'Approved');

  const currentList = activeTab === 'Pending' ? pendingStudents : activeMembers;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Member Management</h2>
            <p className="text-gray-500 text-sm">Review applications and manage active club members</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('Pending')}
          className={`px-4 py-2.5 text-sm font-bold transition-all relative ${
            activeTab === 'Pending' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Applications
          {pendingStudents.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] scale-90 inline-block">
              {pendingStudents.length}
            </span>
          )}
          {activeTab === 'Pending' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.4)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('Approved')}
          className={`px-4 py-2.5 text-sm font-bold transition-all relative ${
            activeTab === 'Approved' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active Members
          <span className="ml-2 text-gray-400 font-medium">({activeMembers.length})</span>
          {activeTab === 'Approved' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full shadow-[0_-2px_8px_rgba(16,185,129,0.4)]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div 
        className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)]"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading members...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center p-16">
            <AlertCircle className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="font-bold text-lg text-gray-500">
              {activeTab === 'Pending' ? 'No pending applications' : 'No active members yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'Pending' 
                ? "You're all caught up! New student applications will appear here." 
                : "Approved students will be listed here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Course Info</th>
                  {activeTab === 'Pending' && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {currentList.map(student => (
                  <tr key={student._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flexItems-center justify-center text-indigo-700 font-bold shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Hash size={10} /> {student.roll_no || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail size={14} className="text-gray-400" />
                        {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                        <BookOpen size={12} className="text-gray-500" />
                        {student.department || 'N/A'} • Year {student.year || '1'}
                      </div>
                    </td>
                    {activeTab === 'Pending' && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={processingId === student._id}
                            onClick={() => handleAction(student._id, 'Approved')}
                            className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white rounded-lg transition-all disabled:opacity-50 group/btn"
                            title="Approve Application"
                          >
                            {processingId === student._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          </button>
                          <button
                            disabled={processingId === student._id}
                            onClick={() => handleAction(student._id, 'Rejected')}
                            className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                            title="Reject Application"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
