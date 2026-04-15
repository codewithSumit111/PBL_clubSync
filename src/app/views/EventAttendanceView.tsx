import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Loader2, QrCode, ShieldCheck, Ticket, ChevronDown, History, X } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeScanner } from '../components/student/QRCodeScanner';
import { checkInForEvent, fetchAllClubsEvents, ClubEvent } from '../services/attendanceApi';

interface EventOption {
    eventId: string;
    clubName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    ccaHours: number;
    _sortTimestamp: number; // Internal field for sorting
}

interface EventAttendanceViewProps {
    onViewChange?: (view: string) => void;
}

export const EventAttendanceView: React.FC<EventAttendanceViewProps> = ({ onViewChange }) => {
    const [eventId, setEventId] = useState('');
    const [manualToken, setManualToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [lastResponse, setLastResponse] = useState<any>(null);
    const [events, setEvents] = useState<EventOption[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [showEventPicker, setShowEventPicker] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadEvents = async () => {
            try {
                setEventsLoading(true);
                const data = await fetchAllClubsEvents();
                if (!isMounted) return;

                const allEvents: EventOption[] = [];
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                data.clubs.forEach(club => {
                    (club.events || []).forEach((event: ClubEvent) => {
                        // Only show upcoming events or events from today
                        const eventDate = new Date(event.date);
                        eventDate.setHours(0, 0, 0, 0);
                        
                        if (eventDate.getTime() >= today.getTime()) {
                            allEvents.push({
                                eventId: event._id,
                                clubName: club.club_name,
                                eventTitle: event.title,
                                eventDate: new Date(event.date).toLocaleDateString('en-IN'),
                                eventTime: event.time || 'TBD',
                                ccaHours: event.cca_hours || 0,
                                _sortTimestamp: eventDate.getTime(),
                            });
                        }
                    });
                });
                
                // Sort by date ascending
                allEvents.sort((a, b) => a._sortTimestamp - b._sortTimestamp);
                setEvents(allEvents);
            } catch (err: any) {
                if (isMounted) {
                    toast.error('Failed to load available events');
                }
            } finally {
                if (isMounted) {
                    setEventsLoading(false);
                }
            }
        };

        loadEvents();

        // Refresh events every 30 seconds to catch any new events or time window changes
        const interval = setInterval(loadEvents, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const canSubmit = useMemo(() => manualToken.trim().length > 0, [manualToken]);

    // Helper: extract eventId from a QR token payload (base64url encoded JSON before the dot)
    const extractEventIdFromToken = (token: string): string | null => {
        try {
            const parts = token.trim().split('.');
            if (parts.length !== 2) return null;
            // base64url decode the payload part
            const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = atob(base64);
            const payload = JSON.parse(jsonStr);
            return payload.eventId || null;
        } catch {
            return null;
        }
    };

    const handleScan = async (token: string) => {
        setLoading(true);
        setMessage(null);

        // Determine eventId: use selected event, or auto-extract from token
        let resolvedEventId = eventId.trim();
        if (!resolvedEventId) {
            const extracted = extractEventIdFromToken(token);
            if (extracted) {
                resolvedEventId = extracted;
                setEventId(extracted);
            } else {
                setMessage('Could not determine event. Please select an event first.');
                toast.error('Select an event or scan a valid QR code');
                setLoading(false);
                return;
            }
        }

        try {
            const result = await checkInForEvent(resolvedEventId, token.trim());
            setLastResponse(result);
            setMessage(result.alreadyCheckedIn ? 'You were already checked in for this event.' : 'Attendance marked successfully.');
            
            // Remove event from list if successful
            if (!result.alreadyCheckedIn) {
                setEvents(prev => prev.filter(e => e.eventId !== resolvedEventId));
            }
            
            setShowModal(true);
        } catch (error: any) {
            setMessage(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const submitManualToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) {
            toast.error('Enter QR token');
            return;
        }

        await handleScan(manualToken.trim());
    };

    const handleEventSelect = (event: EventOption) => {
        setEventId(event.eventId);
        setShowEventPicker(false);
        setMessage(null);
        setLastResponse(null);
        toast.success(`Event selected: ${event.eventTitle}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-xl shadow-teal-100/40 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-200">
                        <QrCode size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">QR Attendance Check-In</h2>
                        <p className="text-sm text-gray-500">Scan the club event QR to mark attendance and auto-credit CCA hours.</p>
                    </div>
                </div>
                <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-800 flex items-center gap-2">
                    <ShieldCheck size={16} /> One scan per event. Hours are credited immediately.
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
                <section className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                            <Ticket size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Scanner</h3>
                            <p className="text-sm text-gray-500">Choose an event and point your camera at the QR code.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Event Picker Dropdown */}
                        {showEventPicker && (
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Select Event</label>
                                {eventsLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                                    </div>
                                ) : events.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center text-sm text-gray-600">
                                        No upcoming events available
                                    </div>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                        {events.map((event) => (
                                            <button
                                                key={event.eventId}
                                                onClick={() => handleEventSelect(event)}
                                                type="button"
                                                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-teal-400 hover:bg-teal-50"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900">{event.eventTitle}</h4>
                                                        <p className="text-sm text-gray-600">{event.clubName}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{event.eventDate} @ {event.eventTime}</p>
                                                    </div>
                                                    <div className="rounded-xl bg-teal-50 px-3 py-1 text-right">
                                                        <div className="text-sm font-bold text-teal-600">{event.ccaHours}</div>
                                                        <div className="text-xs text-teal-700">hrs</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Selected Event Display */}
                        {eventId && (
                            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-teal-900">Event Selected</p>
                                    <button 
                                        onClick={() => {
                                            setShowEventPicker(true);
                                            setEventId('');
                                            setManualToken('');
                                        }}
                                        className="text-xs text-teal-600 hover:text-teal-700 underline"
                                    >
                                        Change
                                    </button>
                                </div>
                                <p className="text-sm text-teal-700">{events.find(e => e.eventId === eventId)?.eventTitle}</p>
                            </div>
                        )}

                        {/* Manual Event ID Input */}
                        {showEventPicker && (
                            <>
                                <div className="relative text-center">
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-gray-200"></div>
                                    <span className="relative inline-block bg-white px-3 text-xs font-semibold text-gray-500 uppercase">Or enter manually</span>
                                </div>
                                <input
                                    value={eventId}
                                    onChange={e => setEventId(e.target.value)}
                                    placeholder="Paste event ID from the organizer"
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-400"
                                />
                            </>
                        )}

                        {/* QR Scanner — always visible */}
                        <QRCodeScanner active={true} onScan={handleScan} />

                        {/* Manual Token Fallback — always visible */}
                        <form onSubmit={submitManualToken} className="space-y-3 pt-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Manual QR Token (if camera unavailable)</label>
                            <textarea
                                value={manualToken}
                                onChange={e => setManualToken(e.target.value)}
                                rows={3}
                                placeholder="Paste QR token here"
                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-400 resize-none"
                            />
                            <button
                                type="submit"
                                disabled={loading || !canSubmit}
                                className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Mark Attendance
                            </button>
                        </form>
                    </div>
                </section>

                <aside className="space-y-4">
                    <div className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
                        <h3 className="text-lg font-bold text-gray-900">Check-in Result</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {message || 'Select an event and scan a QR to see the result.'}
                        </p>
                        {lastResponse?.student && (
                            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                                <p className="font-semibold">{lastResponse.student.name}</p>
                                <p>CCA Hours: {lastResponse.student.cca_hours}</p>
                                <p>Event Hours Credited: {lastResponse.event?.cca_hours || 0}</p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[2rem] border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-6 shadow-lg shadow-teal-100">
                        <h3 className="text-lg font-bold text-teal-900">Proxy Resistance</h3>
                        <ul className="mt-3 space-y-2 text-sm text-teal-800">
                            <li>• Signed QR tokens from backend</li>
                            <li>• One attendance per student per event</li>
                            <li>• Immediate CCA hours credit</li>
                            <li>• Rate-limited check-ins</li>
                        </ul>
                    </div>
                </aside>
            </div>

            {/* Success Modal Popup */}
            {showModal && lastResponse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative flex flex-col items-center text-center transform scale-100 animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => {
                                setShowModal(false);
                                setEventId('');
                                setManualToken('');
                                setShowEventPicker(true);
                            }} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg ${lastResponse.alreadyCheckedIn ? 'bg-blue-100 text-blue-500 shadow-blue-500/20' : 'bg-emerald-100 text-emerald-500 shadow-emerald-500/20'}`}>
                            {lastResponse.alreadyCheckedIn ? < ShieldCheck size={40} /> : <CheckCircle2 size={44} />}
                        </div>
                        
                        <h3 className="text-2xl font-black text-gray-900 mb-2">
                            {lastResponse.alreadyCheckedIn ? 'Already Recorded' : 'Success!'}
                        </h3>
                        
                        <p className="text-sm text-gray-500 mb-6 font-medium">
                            {lastResponse.alreadyCheckedIn 
                                ? 'Your attendance for this event was already marked previously.' 
                                : 'Your attendance has been successfully recorded.'}
                        </p>

                        <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Student</p>
                            <p className="font-semibold text-gray-900 mb-3">{lastResponse.student?.name}</p>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Credited</p>
                                    <p className="font-black text-emerald-600">+{lastResponse.event?.cca_hours || 0} Hours</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Total</p>
                                    <p className="font-bold text-gray-900">{lastResponse.student?.cca_hours} Hrs</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full space-y-3">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    if (onViewChange) onViewChange('attendance-history');
                                }}
                                className="w-full py-3 bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-600 shadow-lg shadow-teal-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <History size={18} /> View Check-In History
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEventId('');
                                    setManualToken('');
                                    setShowEventPicker(true);
                                }}
                                className="w-full py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                            >
                                <QrCode size={18} /> Scan Another Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
