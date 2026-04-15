import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    FileText, Download, Users, Building2, Hash, Calendar, BarChart3, Presentation,
    Filter, ChevronDown, RefreshCw, FileSpreadsheet, AlertCircle, FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../../config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'all_members' | 'dept_wise' | 'rollno_wise' | 'cca_summary' | 'single_event' | 'monthly_events' | 'yearly_events';

interface ReportConfig {
    id: ReportType; title: string; description: string;
    icon: React.ElementType; color: string; bg: string;
}
const REPORT_CONFIGS: ReportConfig[] = [
    { id: 'all_members', title: 'All Members', description: 'Full list with CCA marks and hours', icon: Users, color: 'text-teal-700', bg: 'bg-teal-50' },
    { id: 'dept_wise', title: 'Department-wise', description: 'Members grouped by department', icon: Building2, color: 'text-blue-700', bg: 'bg-blue-50' },
    { id: 'rollno_wise', title: 'Roll No. Export', description: 'Sorted by roll number for admin submission', icon: Hash, color: 'text-purple-700', bg: 'bg-purple-50' },
    { id: 'cca_summary', title: 'CCA Rubric Detail', description: 'Rubric-wise breakdown of marks for every student', icon: FileText, color: 'text-amber-700', bg: 'bg-amber-50' },
    { id: 'single_event', title: 'Single Event Report', description: 'Attendance list for a specific event', icon: Presentation, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    { id: 'monthly_events', title: 'Monthly Summary', description: 'All events conducted in a specific month', icon: Calendar, color: 'text-pink-700', bg: 'bg-pink-50' },
    { id: 'yearly_events', title: 'Yearly Rollup', description: 'Complete year activity and attendance', icon: BarChart3, color: 'text-emerald-700', bg: 'bg-emerald-50' },
];

interface MemberRow {
    _id: string; roll_no: string; name: string; department: string;
    year: number; cca_hours: number; cca_marks: number;
    rubric_marks: { participation?: number; leadership?: number; discipline?: number; skill_development?: number; impact?: number };
}

interface EventReportData {
    title: string; clubName: string; generatedAt: string;
    totalEvents: number; totalAttendance: number; totalCCAHours: number;
    events: any[];
}

const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

export const ClubReports: React.FC = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const [selectedReport, setSelectedReport] = useState<ReportType>('all_members');
    const [deptFilter, setDeptFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [eventsList, setEventsList] = useState<any[]>([]);
    const [eventReport, setEventReport] = useState<EventReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    // Event Report Meta for Quarterly formatting
    const [eventReportMeta, setEventReportMeta] = useState<Record<string, { group: string, photoUrl?: string }>>({});

    // Event filter state
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedEventYear, setSelectedEventYear] = useState(new Date().getFullYear());

    const headers = { Authorization: `Bearer ${token}` };

    const fetchMembersAndEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [memRes, evRes] = await Promise.all([
                fetch(`${API}/clubs/members`, { headers }),
                fetch(`${API}/clubs/event-analytics`, { headers }) // Re-use analytics to get event list
            ]);
            const memData = await memRes.json();
            const evData = await evRes.json();
            
            if (!memRes.ok) throw new Error(memData.message || 'Failed to load members');
            setMembers(memData.members || []);
            setEventsList(evData.analytics?.perEvent || []);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchMembersAndEvents(); }, [fetchMembersAndEvents]);

    const isMemberReport = ['all_members', 'dept_wise', 'rollno_wise', 'cca_summary'].includes(selectedReport);
    
    const fetchEventReport = useCallback(async () => {
        if (isMemberReport) {
            setEventReport(null);
            return;
        }

        let query = '';
        if (selectedReport === 'single_event') {
            if (!selectedEventId) { setEventReport(null); return; }
            query = `?type=single&eventId=${selectedEventId}`;
        } else if (selectedReport === 'monthly_events') {
            query = `?type=monthly&month=${selectedMonth}&year=${selectedEventYear}`;
        } else if (selectedReport === 'yearly_events') {
            query = `?type=yearly&year=${selectedEventYear}`;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API}/clubs/event-report${query}`, { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setEventReport(data.report);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch event report');
        } finally {
            setLoading(false);
        }
    }, [selectedReport, selectedEventId, selectedMonth, selectedEventYear, token, isMemberReport]);

    useEffect(() => { fetchEventReport(); }, [fetchEventReport]);

    const departments = ['All', ...Array.from(new Set(members.map(m => m.department).filter(Boolean)))];
    const years = ['All', '1', '2', '3', '4'];

    const filteredData = members.filter(m =>
        (deptFilter === 'All' || m.department === deptFilter) &&
        (yearFilter === 'All' || String(m.year) === yearFilter)
    );

    const sortedData = selectedReport === 'rollno_wise'
        ? [...filteredData].sort((a, b) => (a.roll_no || '').localeCompare(b.roll_no || ''))
        : selectedReport === 'dept_wise'
            ? [...filteredData].sort((a, b) => (a.department || '').localeCompare(b.department || ''))
            : filteredData;

    const downloadCSV = async () => {
        if (sortedData.length === 0) return toast.error('No data to export');
        setGenerating(true);
        try {
            const isCCA = selectedReport === 'cca_summary';
            const headers_row = [
                'Roll No', 'Name', 'Department', 'Year', 'CCA Hours',
                ...(isCCA ? ['Participation', 'Leadership', 'Discipline', 'Skill Dev', 'Impact'] : []),
                'Total Marks (/25)'
            ];
            const rows = sortedData.map(m => [
                m.roll_no || '', m.name || '', m.department || '', `${m.year}th Year`,
                m.cca_hours ?? 0,
                ...(isCCA ? [
                    m.rubric_marks?.participation ?? 0,
                    m.rubric_marks?.leadership ?? 0,
                    m.rubric_marks?.discipline ?? 0,
                    m.rubric_marks?.skill_development ?? 0,
                    m.rubric_marks?.impact ?? 0,
                ] : []),
                m.cca_marks ?? 0,
            ]);

            const csv = [headers_row, ...rows].map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${user?.clubName || 'club'}_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
            toast.success('Report exported successfully!');
        } catch { toast.error('Export failed'); }
        finally { setGenerating(false); }
    };

    const downloadPDF = async () => {
        if (!eventReport || eventReport.events.length === 0) return toast.error('No data to export');
        setGenerating(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const isMonthlyOrYearly = selectedReport === 'monthly_events' || selectedReport === 'yearly_events';
            
            let currentY = 64;

            if (isMonthlyOrYearly) {
                // Header Redesign
                doc.setFontSize(22);
                doc.setTextColor(17, 24, 39); 
                doc.setFont("helvetica", "bold");
                const titleText = selectedReport === 'monthly_events' ? 'Monthly Report' : 'Yearly Report';
                doc.text(titleText, pageWidth / 2, 20, { align: 'center' });
                
                doc.setFontSize(14);
                doc.setFont("helvetica", "normal");
                doc.text(`Student Club: ${user?.clubName || 'Club'}`, pageWidth / 2, 30, { align: 'center' });
                
                doc.setFontSize(12);
                let subtitleText = '';
                if (selectedReport === 'monthly_events') {
                    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth - 1] || '';
                    subtitleText = `Month: ${monthName} / Year: ${selectedEventYear}`;
                } else {
                    subtitleText = `Year: ${selectedEventYear}`;
                }
                doc.text(subtitleText, pageWidth / 2, 38, { align: 'center' });

                // KPI Bar
                doc.setDrawColor(229, 231, 235);
                doc.lineWidth = 0.5;
                doc.line(14, 46, pageWidth - 14, 46);
                doc.setFontSize(10);
                doc.setTextColor(107, 114, 128); // Gray-500
                doc.text(`Total Events: ${eventReport.totalEvents}`, 14, 54);
                doc.text(`Total Attendance: ${eventReport.totalAttendance}`, 70, 54);
                doc.text(`CCA Hours Awarded: ${eventReport.totalCCAHours}`, 140, 54);
                doc.line(14, 58, pageWidth - 14, 58);
                
                currentY = 68;

                const tableData = eventReport.events.map((ev: any, idx: number) => {
                    const meta = eventReportMeta[ev._id] || { group: '' };
                    return [
                        (idx + 1).toString(),
                        meta.group || '',
                        ev.description || '—',
                        `${ev.title}\nVenue: ${ev.venue || 'TBD'}\nDate: ${new Date(ev.date).toLocaleDateString('en-IN')}`,
                        ''
                    ];
                });

                autoTable(doc, {
                    startY: currentY,
                    head: [['Sr. No.', 'Name of Student / Group', 'Participation / Achievement', 'Event', 'Photo']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [13, 148, 136], halign: 'center', textColor: 255 },
                    margin: { left: 14, right: 14 },
                    styles: { fontSize: 10, minCellHeight: 45, valign: 'middle' },
                    columnStyles: {
                        0: { cellWidth: 15, halign: 'center' },
                        1: { cellWidth: 40 },
                        2: { cellWidth: 'auto' },
                        3: { cellWidth: 45 },
                        4: { cellWidth: 35, halign: 'center' }
                    },
                    didDrawCell: (data) => {
                        if (data.section === 'body' && data.column.index === 4) {
                            const ev = eventReport.events[data.row.index];
                            if (!ev) return;
                            const meta = eventReportMeta[ev._id];
                            if (meta && meta.photoUrl) {
                                try {
                                    const dim = data.cell;
                                    const padding = 2;
                                    const w = dim.width - padding * 2;
                                    const h = dim.height - padding * 2;
                                    
                                    const formatMatch = meta.photoUrl.match(/data:image\/([a-zA-Z]+);base64,/);
                                    let format = 'JPEG';
                                    if (formatMatch && formatMatch[1]) {
                                        const mimeStr = formatMatch[1].toLowerCase();
                                        if (mimeStr === 'png') format = 'PNG';
                                        if (mimeStr === 'webp') format = 'WEBP'; 
                                    }

                                    const imgProps = doc.getImageProperties(meta.photoUrl);
                                    if (imgProps) {
                                        let imgW = w;
                                        let imgH = (imgProps.height * w) / imgProps.width;
                                        if (imgH > h) {
                                            imgH = h;
                                            imgW = (imgProps.width * h) / imgProps.height;
                                        }
                                        const xOffset = (w - imgW) / 2;
                                        const yOffset = (h - imgH) / 2;
                                        doc.addImage(meta.photoUrl, format, dim.x + padding + xOffset, dim.y + padding + yOffset, imgW, imgH);
                                    } else {
                                        doc.addImage(meta.photoUrl, format, dim.x + padding, dim.y + padding, w, h);
                                    }
                                } catch(e) {
                                    console.error("Failed to embed image", e);
                                }
                            }
                        }
                    }
                });
                
                currentY = (doc as any).lastAutoTable.finalY + 15;
            } else {
                // Header (Single Event)
                doc.setFontSize(18);
                doc.setTextColor(13, 148, 136); // Teal-600
                doc.text(eventReport.clubName, 14, 20);
                
                doc.setFontSize(14);
                doc.setTextColor(75, 85, 99); // Gray-600
                doc.text(eventReport.title, 14, 30);
                
                doc.setFontSize(10);
                doc.setTextColor(107, 114, 128); // Gray-500
                doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
                
                // KPI Bar
                doc.setDrawColor(229, 231, 235);
                doc.line(14, 42, pageWidth - 14, 42);
                doc.text(`Total Events: ${eventReport.totalEvents}`, 14, 50);
                doc.text(`Total Attendance: ${eventReport.totalAttendance}`, 70, 50);
                doc.text(`CCA Hours Awarded: ${eventReport.totalCCAHours}`, 140, 50);
                doc.line(14, 54, pageWidth - 14, 54);

                currentY = 64;

                eventReport.events.forEach((ev, idx) => {
                    if (currentY > 250) {
                        doc.addPage();
                        currentY = 20;
                    }
                    
                    doc.setFontSize(12);
                    doc.setTextColor(17, 24, 39); // Gray-900
                    doc.setFont("helvetica", "bold");
                    doc.text(ev.title, 14, currentY);
                    
                    doc.setFontSize(10);
                    doc.setTextColor(107, 114, 128);
                    doc.setFont("helvetica", "normal");
                    const evtDate = new Date(ev.date).toLocaleDateString('en-IN');
                    doc.text(`${evtDate} at ${ev.time || 'TBD'} • Venue: ${ev.venue || 'TBD'} • Attendees: ${ev.attendanceCount}`, 14, currentY + 6);
                    
                    if (ev.description) {
                        doc.text(`Aim: ${ev.description}`, 14, currentY + 12);
                        currentY += 18;
                    } else {
                        currentY += 12;
                    }

                    if (ev.attendees.length > 0) {
                        const tableData = ev.attendees.map((a: any) => [
                            a.roll_no || '—',
                            a.name,
                            a.department || '—',
                            a.cca_hours_awarded ? `+${a.cca_hours_awarded} hrs` : '-',
                            new Date(a.checked_in_at).toLocaleTimeString()
                        ]);

                        autoTable(doc, {
                            startY: currentY,
                            head: [['Roll No', 'Name', 'Department', 'CCA Hours', 'Check-in Time']],
                            body: tableData,
                            theme: 'striped',
                            headStyles: { fillColor: [13, 148, 136] },
                            margin: { left: 14, right: 14 },
                            styles: { fontSize: 9 },
                        });

                        currentY = (doc as any).lastAutoTable.finalY + 15;
                    } else {
                        doc.text("No attendees recorded.", 14, currentY);
                        currentY += 10;
                    }
                });
            }

            doc.save(`${user?.clubName || 'club'}_${selectedReport.replace('_', '')}.pdf`);
            toast.success('PDF generated successfully!');
        } catch (e: any) {
            console.error(e);
            toast.error('Failed to generate PDF');
        } finally {
            setGenerating(false);
        }
    };

    if (error && members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-gray-600 font-semibold">{error}</p>
                <button onClick={fetchMembers} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold">Retry</button>
            </div>
        );
    }

    const YEAR_LABELS: Record<string, string> = { '1': '1st', '2': '2nd', '3': '3rd', '4': '4th' };
    const isCCA = selectedReport === 'cca_summary';
    const showDept = selectedReport === 'dept_wise' || selectedReport === 'all_members';

    const avgHours = sortedData.length > 0 ? (sortedData.reduce((s, r) => s + (r.cca_hours || 0), 0) / sortedData.length).toFixed(1) : '—';
    const avgMarks = sortedData.length > 0 ? (sortedData.reduce((s, r) => s + (r.cca_marks || 0), 0) / sortedData.length).toFixed(1) : '—';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reports & Exports</h2>
                    <p className="text-gray-500 text-sm mt-1">Live data from your club members</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchMembersAndEvents}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    {isMemberReport ? (
                        <button onClick={downloadCSV} disabled={generating || loading || sortedData.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 shadow-lg shadow-teal-200 disabled:opacity-60 transition h-10 w-[140px] justify-center">
                            {generating ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />} Export CSV
                        </button>
                    ) : (
                        <button onClick={downloadPDF} disabled={generating || loading || !eventReport || eventReport.events.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 shadow-lg shadow-indigo-200 disabled:opacity-60 transition h-10 w-[140px] justify-center">
                            {generating ? <RefreshCw size={15} className="animate-spin" /> : <FileDown size={15} />} Export PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Report Type Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                {REPORT_CONFIGS.map(r => (
                    <button key={r.id} onClick={() => setSelectedReport(r.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 text-center ${
                            selectedReport === r.id ? `border-${r.color.split('-')[1]}-400 ${r.bg} shadow-md scale-[1.02]` : 'border-white/50 bg-white/60 hover:bg-white'
                        }`}>
                        <r.icon size={24} className={`mb-2 ${selectedReport === r.id ? r.color : 'text-gray-400'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedReport === r.id ? 'text-gray-900' : 'text-gray-500'}`}>
                            {r.title}
                        </span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className={`${cardClass} p-4 flex flex-wrap gap-3 items-center min-h-[72px]`}>
                <span className="text-sm font-semibold text-gray-600 flex items-center gap-2"><Filter size={14} /> Params:</span>
                
                {isMemberReport ? (
                    <>
                        <div className="relative">
                            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                                className="pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 appearance-none cursor-pointer">
                                {departments.map(d => <option key={d}>Dept: {d}</option>)}
                            </select>
                            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                                className="pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 appearance-none cursor-pointer">
                                {years.map(y => <option key={y}>Year: {y === 'All' ? 'All' : `${YEAR_LABELS[y]} Year`}</option>)}
                            </select>
                            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <span className="text-xs text-gray-400 ml-auto">{sortedData.length} records</span>
                    </>
                ) : (
                    <>
                        {selectedReport === 'single_event' && (
                            <div className="relative w-full max-w-xs">
                                <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-indigo-400 appearance-none cursor-pointer">
                                    <option value="">-- Select Event --</option>
                                    {eventsList.map((e: any) => (
                                        <option key={e._id} value={e._id}>{e.title}</option>
                                    ))}
                                </select>
                                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                        
                        {selectedReport === 'monthly_events' && (
                            <div className="relative">
                                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                                    className="pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-indigo-400 appearance-none cursor-pointer">
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}

                        {(selectedReport === 'monthly_events' || selectedReport === 'yearly_events') && (
                            <div className="relative">
                                <select value={selectedEventYear} onChange={e => setSelectedEventYear(Number(e.target.value))}
                                    className="pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-indigo-400 appearance-none cursor-pointer">
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                        
                        <span className="text-xs text-gray-400 ml-auto">{eventReport ? `${eventReport.totalAttendance} attendances across ${eventReport.totalEvents} events` : 'Ready'}</span>
                    </>
                )}
            </div>

            {/* Table Preview */}
            <div className={`${cardClass} overflow-hidden`}>
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet size={16} className={isMemberReport ? 'text-teal-600' : 'text-indigo-600'} />
                        <h3 className="font-bold text-gray-900">
                            {REPORT_CONFIGS.find(r => r.id === selectedReport)?.title} — Preview
                        </h3>
                    </div>
                    {isMemberReport ? (
                        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1 font-mono">Members Data</span>
                    ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1 font-mono">PDF Preview</span>
                    )}
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <RefreshCw size={24} className="animate-spin mr-2" /> Loading from database...
                    </div>
                ) : isMemberReport ? (
                    sortedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Users size={32} className="mb-2 opacity-40" />
                            <p className="font-medium">No members match the selected filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Roll No</th>
                                        <th className="px-4 py-3">Name</th>
                                        {showDept && <th className="px-4 py-3">Dept</th>}
                                        <th className="px-4 py-3">Year</th>
                                        <th className="px-4 py-3">CCA Hrs</th>
                                        {isCCA && (<>
                                            <th className="px-4 py-3 text-center">Part.</th>
                                            <th className="px-4 py-3 text-center">Lead.</th>
                                            <th className="px-4 py-3 text-center">Disc.</th>
                                            <th className="px-4 py-3 text-center">Skill</th>
                                            <th className="px-4 py-3 text-center">Impact</th>
                                        </>)}
                                        <th className="px-4 py-3">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {sortedData.map((m, i) => (
                                        <tr key={m._id || i} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-700">{m.roll_no || '—'}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                                            {showDept && (
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{m.department || '—'}</span>
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-gray-600">{m.year ? `${m.year}${['st', 'nd', 'rd', 'th'][Math.min(m.year - 1, 3)]} Year` : '—'}</td>
                                            <td className="px-4 py-3"><span className="font-bold text-teal-700">{m.cca_hours ?? 0}</span> <span className="text-gray-400 text-xs">h</span></td>
                                            {isCCA && (<>
                                                <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.participation ?? 0}</td>
                                                <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.leadership ?? 0}</td>
                                                <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.discipline ?? 0}</td>
                                                <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.skill_development ?? 0}</td>
                                                <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.impact ?? 0}</td>
                                            </>)}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-gray-100 rounded-full">
                                                        <div className="h-2 rounded-full" style={{ width: `${((m.cca_marks ?? 0) / 25) * 100}%`, background: 'linear-gradient(90deg, #0d9488, #10b981)' }} />
                                                    </div>
                                                    <span className="text-xs font-black text-gray-900">{m.cca_marks ?? 0}/25</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-teal-50 text-teal-800 text-sm font-bold">
                                    <tr>
                                        <td className="px-4 py-3 font-black" colSpan={2}>AVERAGE</td>
                                        {showDept && <td />}
                                        <td />
                                        <td className="px-4 py-3">{avgHours} h</td>
                                        {isCCA && <><td /><td /><td /><td /><td /></>}
                                        <td className="px-4 py-3">{avgMarks}/25</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )
                ) : (
                    // Event Report PDF Preview
                    <div className="p-4 bg-gray-50/50 min-h-[300px]">
                        {!eventReport ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <Presentation size={32} className="mb-2 opacity-40" />
                                <p className="font-medium">Please select parameters to view preview</p>
                            </div>
                        ) : eventReport.events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <AlertCircle size={32} className="mb-2 opacity-40 text-red-300" />
                                <p className="font-medium">No events found for this filter</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center pb-4 border-b border-gray-200">
                                    <h4 className="text-xl font-black text-gray-900 mb-1">{eventReport.title}</h4>
                                    <p className="text-sm text-gray-500">Totals: {eventReport.totalEvents} Events • {eventReport.totalAttendance} Attendances</p>
                                </div>
                                {selectedReport === 'monthly_events' || selectedReport === 'yearly_events' ? (
                                    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
                                        <table className="w-full text-left bg-white text-sm">
                                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 whitespace-nowrap">Sr. No.</th>
                                                    <th className="px-4 py-3 min-w-[200px]">Name of Student / Group</th>
                                                    <th className="px-4 py-3 min-w-[250px]">Participation / Achievement</th>
                                                    <th className="px-4 py-3 min-w-[150px]">Event</th>
                                                    <th className="px-4 py-3 min-w-[120px]">Photo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {eventReport.events.map((ev: any, idx: number) => {
                                                    const meta = eventReportMeta[ev._id] || { group: '' };
                                                    return (
                                                        <tr key={ev._id || idx} className="hover:bg-gray-50/50">
                                                            <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                                                            <td className="px-4 py-3">
                                                                <input type="text"
                                                                    placeholder="e.g. John Doe / Web Team"
                                                                    className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none transition"
                                                                    value={meta.group || ''}
                                                                    onChange={(e) => setEventReportMeta(prev => ({...prev, [ev._id]: { ...prev[ev._id], group: e.target.value}}))}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600 text-xs leading-relaxed">{ev.description || '—'}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-semibold text-gray-900">{ev.title}</div>
                                                                <div className="text-xs text-gray-500 mt-1">Venue: {ev.venue || 'TBD'}</div>
                                                                <div className="text-xs text-gray-500">Date: {new Date(ev.date).toLocaleDateString('en-IN')}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {meta.photoUrl ? (
                                                                    <div className="flex flex-col gap-2 items-start">
                                                                        <img src={meta.photoUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                                                        <button onClick={() => setEventReportMeta(prev => ({...prev, [ev._id]: { ...prev[ev._id], photoUrl: undefined}}))} 
                                                                            className="text-xs font-semibold text-red-500 hover:text-red-700 transition">Remove</button>
                                                                    </div>
                                                                ) : (
                                                                    <label className="flex items-center justify-center w-full min-h-[64px] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-teal-400 transition mb-0">
                                                                        <span className="text-xs text-gray-500 font-medium">+ Add Photo</span>
                                                                        <input type="file" accept="image/*" className="hidden"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    const reader = new FileReader();
                                                                                    reader.onload = () => {
                                                                                        setEventReportMeta(prev => ({...prev, [ev._id]: { ...prev[ev._id], photoUrl: reader.result as string }}));
                                                                                    };
                                                                                    reader.readAsDataURL(file);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </label>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <>
                                        {eventReport.events.map((ev: any, idx: number) => (
                                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                                                <div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
                                                    <div>
                                                        <h5 className="font-bold text-gray-900 text-sm">{ev.title}</h5>
                                                        <p className="text-xs text-gray-500">{new Date(ev.date).toLocaleDateString()} • {ev.attendanceCount} Attendees</p>
                                                    </div>
                                                </div>
                                                <table className="w-full text-left whitespace-nowrap text-xs">
                                                    <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-3 py-2 font-medium">Roll No</th>
                                                            <th className="px-3 py-2 font-medium">Name</th>
                                                            <th className="px-3 py-2 font-medium text-right">Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {ev.attendees.length === 0 ? (
                                                            <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400">No attendance records</td></tr>
                                                        ) : (
                                                            ev.attendees.slice(0, 5).map((a: any, i: number) => (
                                                                <tr key={i}>
                                                                    <td className="px-3 py-2 font-mono text-gray-600">{a.roll_no}</td>
                                                                    <td className="px-3 py-2 font-semibold text-gray-800">{a.name}</td>
                                                                    <td className="px-3 py-2 text-right text-gray-500">{new Date(a.checked_in_at).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</td>
                                                                </tr>
                                                            ))
                                                        )}
                                                        {ev.attendees.length > 5 && (
                                                            <tr><td colSpan={3} className="px-3 py-2 text-center text-indigo-500 bg-indigo-50/30">...and {ev.attendees.length - 5} more elements. (Download PDF for full list)</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
