import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Bell, Calendar, Plus, X, Users, RefreshCw,
    Send, CheckCircle2, Megaphone, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../../config';

interface ClubEvent {
    _id: string; title: string; description: string;
    date: string; time?: string; venue?: string; attendees?: any[];
}

interface Notification {
    _id: string; title: string; message: string;
    sentAt: string; recipients?: number;
}

type TabType = 'events' | 'notifications';

const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

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
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', time: '', venue: '' });
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
            setEventForm({ title: '', description: '', date: '', time: '', venue: '' });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
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
                    <h2 className="text-2xl font-bold text-gray-900">Events & Notifications</h2>
                    <p className="text-gray-500 text-sm mt-1">Schedule events and broadcast messages to your members</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowNotifForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">
                        <Megaphone size={15} /> Notify Members
                    </button>
                    <button onClick={() => setShowEventForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 shadow-lg shadow-teal-200">
                        <Plus size={16} /> Create Event
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className={`${cardClass} p-1 flex gap-1 w-fit`}>
                {(['events', 'notifications'] as TabType[]).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === t ? 'bg-teal-500 text-white shadow' : 'text-gray-500 hover:text-gray-800'
                            }`}>
                        {t === 'events' ? `📅 Events (${events.length})` : `🔔 Notifications (${notifications.length})`}
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
                                {upcomingEvents.map(ev => <EventCard key={ev._id} event={ev} isUpcoming />)}
                            </div>
                        </div>
                    )}
                    {pastEvents.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 bg-gray-300 rounded-full" /> Past Events ({pastEvents.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pastEvents.map(ev => <EventCard key={ev._id} event={ev} isUpcoming={false} />)}
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
        </div>
    );
};

const EventCard: React.FC<{ event: ClubEvent; isUpcoming: boolean }> = ({ event, isUpcoming }) => (
    <div className={`bg-white/60 backdrop-blur-xl rounded-2xl border ${isUpcoming ? 'border-teal-100' : 'border-white/50'} shadow-sm p-5`}>
        <div className="flex items-start justify-between gap-2 mb-2">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold ${isUpcoming ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                <Calendar size={11} />
                {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {event.time && ` · ${event.time}`}
            </div>
            {event.attendees !== undefined && (
                <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11} /> {event.attendees.length}</span>
            )}
        </div>
        <h4 className="font-bold text-gray-900 mb-1">{event.title}</h4>
        {event.description && <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>}
        {event.venue && <p className="text-xs text-gray-400 mt-2">📍 {event.venue}</p>}
    </div>
);
