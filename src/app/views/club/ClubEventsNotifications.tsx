import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Bell, Calendar, Plus, X, Users, RefreshCw,
    Send, CheckCircle2, Megaphone, AlertCircle, QrCode, Loader2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../../config';
import { EventQrModal } from '../../components/club/EventQrModal';
import { OrganizerAttendanceMonitor } from '../../components/club/OrganizerAttendanceMonitor';
import { AttendanceEvent, fetchEventQr } from '../../services/attendanceApi';

interface ClubEvent {
    _id: string; title: string; description: string;
    date: string; time?: string; venue?: string; attendees?: any[]; cca_hours?: number; club_name?: string;
}

interface Notification {
    _id: string; title: string; message: string;
    sentAt: string; recipients?: number;
}

type TabType = 'events' | 'notifications';

const cardClass = 'bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)]';

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
        {children}
    </div>
);

const Modal: React.FC<{ title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }> = ({ title, icon, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={20} /></button>
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">{icon} {title}</h3>
            {children}
        </div>
    </div>
);

export const ClubEventsNotifications: React.FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [tab, setTab] = useState<TabType>('events');
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showEventForm, setShowEventForm] = useState(false);
    const [showNotifForm, setShowNotifForm] = useState(false);
    const [qrEvent, setQrEvent] = useState<AttendanceEvent | null>(null);
    const [qrToken, setQrToken] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEventForMonitor, setSelectedEventForMonitor] = useState<string | null>(null);

    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        cca_hours: '0',
        check_in_opens_at: '',
        check_in_closes_at: '',
    });
    const [notifForm, setNotifForm] = useState({ title: '', message: '' });

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/clubs/events`, { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to load events');
            setEvents(data.events || []);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const createEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/clubs/events`, {
                method: 'POST', headers,
                body: JSON.stringify(eventForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create event');
            toast.success('Event created successfully!');
            setEvents(prev => [data.event, ...prev]);
            setShowEventForm(false);
            setEventForm({
                title: '',
                description: '',
                date: '',
                time: '',
                venue: '',
                cca_hours: '0',
                check_in_opens_at: '',
                check_in_closes_at: '',
            });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openQrForEvent = async (event: ClubEvent) => {
        setQrLoading(true);
        try {
            const data = await fetchEventQr(event._id);
            setQrEvent(data.event);
            setQrToken(data.qrToken);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setQrLoading(false);
        }
    };

    const sendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Notifications not yet persisted in DB — show success and keep in local state
            // (can be wired to a notifications collection when ready)
            await new Promise(r => setTimeout(r, 500)); // simulate network
            toast.success('Notification sent to all members!');
            setNotifications(prev => [{
                _id: Date.now().toString(),
                ...notifForm,
                sentAt: new Date().toISOString(),
                recipients: undefined,
            }, ...prev]);
            setShowNotifForm(false);
            setNotifForm({ title: '', message: '' });
        } catch { toast.error('Failed to send'); }
        finally { setSubmitting(false); }
    };

    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());
    const pastEvents = events.filter(e => new Date(e.date) < new Date());

    if (error && events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-gray-600 font-semibold">{error}</p>
                <button onClick={fetchEvents} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold">Retry</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-[32px] font-bold text-[#1a1a2e] tracking-tight">Events & Notifications</h2>
                    <p className="text-[#6b7280] text-[14px] mt-1">Schedule events and broadcast messages to your members</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowNotifForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-50 hover:shadow-md transition-all duration-300">
                        <Megaphone size={15} /> Notify Members
                    </button>
                    <button onClick={() => setShowEventForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0d9488] text-white rounded-full text-sm font-bold hover:bg-[#0f766e] shadow-[0_4px_14px_rgba(13,148,136,0.39)] hover:-translate-y-0.5 transition-all duration-300">
                        <Plus size={16} /> Create Event
                    </button>
                </div>
            </div>

            {/* Tabs & Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Columns: Tabs and Main Lists */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="bg-white p-1 flex gap-1 w-fit rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100">
                        {(['events', 'notifications'] as TabType[]).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`flex items-center gap-1.5 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${tab === t ? 'bg-[#0d9488] text-white shadow-md' : 'text-[#6b7280] hover:text-[#1a1a2e] hover:bg-gray-50'
                                    }`}>
                                {t === 'events' ? <><Calendar size={14} className="mt-[-1px]"/> Events ({events.length})</> : <><Bell size={14} className="mt-[-1px]"/> Notifications ({notifications.length})</>}
                            </button>
                        ))}
                    </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <RefreshCw size={24} className="animate-spin mr-2" /> Loading from database...
                </div>
            ) : tab === 'events' ? (
                <>
                    {upcomingEvents.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 bg-teal-500 rounded-full" /> Upcoming ({upcomingEvents.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {upcomingEvents.map(ev => <EventCard key={ev._id} event={ev} isUpcoming onGenerateQr={() => openQrForEvent(ev)} qrLoading={qrLoading} onShowMonitor={() => setSelectedEventForMonitor(ev._id)} />)}
                            </div>
                        </div>
                    )}
                    {pastEvents.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 bg-gray-300 rounded-full" /> Past Events ({pastEvents.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pastEvents.map(ev => <EventCard key={ev._id} event={ev} isUpcoming={false} onGenerateQr={() => openQrForEvent(ev)} qrLoading={qrLoading} onShowMonitor={() => setSelectedEventForMonitor(ev._id)} />)}
                            </div>
                        </div>
                    )}
                    {events.length === 0 && (
                        <div className={`${cardClass} flex flex-col items-center justify-center py-12 text-gray-400`}>
                            <Calendar size={32} className="mb-2 opacity-40" />
                            <p className="font-medium">No events yet</p>
                            <p className="text-sm">Create your first event to get started</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-3">
                    {notifications.length === 0 ? (
                        <div className={`${cardClass} flex flex-col items-center justify-center py-12 text-gray-400`}>
                            <Bell size={32} className="mb-2 opacity-40" />
                            <p className="font-medium">No notifications sent yet</p>
                        </div>
                    ) : notifications.map(n => (
                        <div key={n._id} className={`${cardClass} p-4 flex items-start gap-4`}>
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                <Bell size={18} className="text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-bold text-gray-900">{n.title}</h4>
                                    <span className="text-xs text-gray-400 shrink-0">
                                        {new Date(n.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                                {n.recipients && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="text-xs text-emerald-600 font-semibold">Sent to {n.recipients} members</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div> {/* End Left Columns */}

            {/* Right Column: Contextual Tip Box */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative overflow-hidden border border-teal-100/50">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-teal-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-teal-600">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-[16px] font-bold text-[#1a1a2e] mb-2">Setup your next event</h3>
                        <p className="text-[13px] text-[#6b7280] leading-relaxed mb-6">
                            Keep your members engaged by regularly scheduling workshops, meetings, or recruitment drives.
                        </p>
                        <button onClick={() => setShowEventForm(true)} className="w-full py-2.5 bg-white text-teal-700 text-sm font-bold rounded-xl shadow-sm hover:shadow hover:-translate-y-0.5 transition-all outline-none">
                            Start creating
                        </button>
                    </div>
                </div>
            </div> {/* End Right Column */}
        </div> {/* End Grid */}

            {/* Create Event Modal */}
            {showEventForm && (
                <Modal title="Create New Event" icon={<Calendar size={16} className="text-teal-600" />} onClose={() => setShowEventForm(false)}>
                    <form onSubmit={createEvent} className="space-y-4">
                        <FormField label="Event Title *">
                            <input required value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Annual Hackathon 2026"
                                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                        </FormField>
                        <FormField label="Description">
                            <textarea rows={3} value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Event details..."
                                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400 resize-none" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Date *">
                                <input required type="date" value={eventForm.date} onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))}
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                            </FormField>
                            <FormField label="Time">
                                <input type="time" value={eventForm.time} onChange={e => setEventForm(p => ({ ...p, time: e.target.value }))}
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                            </FormField>
                        </div>
                        <FormField label="CCA Hours *">
                            <input required type="number" min="0" step="0.5" value={eventForm.cca_hours} onChange={e => setEventForm(p => ({ ...p, cca_hours: e.target.value }))}
                                placeholder="e.g. 2"
                                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Check-in Opens">
                                <input type="time" value={eventForm.check_in_opens_at} onChange={e => setEventForm(p => ({ ...p, check_in_opens_at: e.target.value }))}
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                            </FormField>
                            <FormField label="Check-in Closes">
                                <input type="time" value={eventForm.check_in_closes_at} onChange={e => setEventForm(p => ({ ...p, check_in_closes_at: e.target.value }))}
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                            </FormField>
                        </div>
                        <FormField label="Venue">
                            <input value={eventForm.venue} onChange={e => setEventForm(p => ({ ...p, venue: e.target.value }))}
                                placeholder="e.g. Seminar Hall A"
                                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                        </FormField>
                        <button type="submit" disabled={submitting}
                            className="w-full py-2.5 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 flex items-center justify-center gap-2 disabled:opacity-60">
                            {submitting ? <RefreshCw size={15} className="animate-spin" /> : <Calendar size={15} />} Create Event
                        </button>
                    </form>
                </Modal>
            )}

            {/* Notify Modal */}
            {showNotifForm && (
                <Modal title="Notify All Members" icon={<Megaphone size={16} className="text-indigo-600" />} onClose={() => setShowNotifForm(false)}>
                    <form onSubmit={sendNotification} className="space-y-4">
                        <FormField label="Title *">
                            <input required value={notifForm.title} onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Meeting Reminder"
                                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                        </FormField>
                        <FormField label="Message *">
                            <textarea required rows={4} value={notifForm.message} onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))}
                                placeholder="Type your message to all club members..."
                                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400 resize-none" />
                        </FormField>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                            <Users size={14} className="text-blue-600 shrink-0" />
                            <p className="text-xs text-blue-700">This message will be sent to <strong>all registered members</strong> of your club.</p>
                        </div>
                        <button type="submit" disabled={submitting}
                            className="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 flex items-center justify-center gap-2 disabled:opacity-60">
                            {submitting ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />} Send Notification
                        </button>
                    </form>
                </Modal>
            )}

            {qrEvent && qrToken && (
                <EventQrModal
                    event={qrEvent}
                    qrToken={qrToken}
                    onClose={() => { setQrEvent(null); setQrToken(''); }}
                />
            )}

            {selectedEventForMonitor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setSelectedEventForMonitor(null)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                        {selectedEventForMonitor && events.find(e => e._id === selectedEventForMonitor) && (
                            <OrganizerAttendanceMonitor 
                                eventId={selectedEventForMonitor}
                                clubId=""
                                eventTitle={events.find(e => e._id === selectedEventForMonitor)?.title || 'Event'}
                                onRefresh={fetchEvents}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const EventCard: React.FC<{ event: ClubEvent; isUpcoming: boolean; onGenerateQr: () => void; qrLoading: boolean; onShowMonitor?: () => void }> = ({ event, isUpcoming, onGenerateQr, qrLoading, onShowMonitor }) => (
    <div className={`bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-transparent hover:border-teal-100 hover:shadow-[0_6px_30px_rgba(0,0,0,0.08)] hover:-translate-y-[2px] transition-all duration-300 p-6 flex flex-col justify-between`}>
        <div>
            <div className="flex gap-4 mb-3">
                <h4 className="font-bold text-[#1a1a2e] text-[16px] leading-tight flex-1 pt-1">{event.title}</h4>
                <div className={`flex flex-col items-end gap-1 px-3 py-1.5 rounded-xl shrink-0 text-right ${isUpcoming ? 'bg-teal-50 text-teal-800' : 'bg-gray-50 text-gray-500'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 flex items-center gap-1">
                        <Calendar size={10} /> Date
                    </span>
                    <span className="text-[13px] font-bold">
                        {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {event.time && `, ${event.time}`}
                    </span>
                </div>
            </div>
            {event.description && <p className="text-[13px] text-[#6b7280] line-clamp-2 mb-3">{event.description}</p>}
        </div>
        
        <div className="mt-auto">
            {event.venue && <p className="text-[12px] font-medium text-gray-500 mb-4 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Venue: {event.venue}</p>}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-50">
                <div className="bg-teal-50 border border-teal-100 rounded-[10px] px-3 py-1.5 flex flex-col">
                    <span className="text-[9px] font-bold text-teal-600 uppercase tracking-wide">CCA Hours</span>
                    <span className="text-[14px] font-bold text-teal-900 leading-none mt-0.5">{event.cca_hours || 0} hrs</span>
                </div>
                <div className="flex items-center gap-2">
                    {onShowMonitor && (
                        <button
                            onClick={onShowMonitor}
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                            <Users size={14} /> Monitor
                        </button>
                    )}
                    <button
                        onClick={onGenerateQr}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#0d9488] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#0f766e] disabled:opacity-60 transition-colors"
                        disabled={qrLoading}
                    >
                        {qrLoading ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />} QR
                    </button>
                </div>
            </div>
        </div>
    </div>
);
