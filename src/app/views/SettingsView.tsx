import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    User, Lock, Bell, Palette, Save, RefreshCw,
    Mail, Shield, Building2, Hash, Eye, EyeOff,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../config';

const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

type TabType = 'profile' | 'security' | 'notifications' | 'appearance';

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
];

export const SettingsView: React.FC = () => {
    const { user, token } = useSelector((state: RootState) => state.auth);
    const [tab, setTab] = useState<TabType>('profile');

    // Security state
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);

    // Notification prefs (localStorage)
    const [notifPrefs, setNotifPrefs] = useState(() => {
        const stored = localStorage.getItem('clubsync_notif_prefs');
        return stored ? JSON.parse(stored) : {
            newApplications: true,
            logbookSubmissions: true,
            eventReminders: true,
            weeklyDigest: false,
        };
    });

    // Appearance
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('clubsync_dark') === 'true');

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPwd.length < 6) return toast.error('New password must be at least 6 characters');
        if (newPwd !== confirmPwd) return toast.error('Passwords do not match');
        setSaving(true);
        try {
            const res = await fetch(`${API}/auth/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to change password');
            toast.success('Password changed successfully!');
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleNotif = (key: string) => {
        const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
        setNotifPrefs(updated);
        localStorage.setItem('clubsync_notif_prefs', JSON.stringify(updated));
        toast.success('Preference updated');
    };

    const toggleDark = () => {
        const next = !darkMode;
        setDarkMode(next);
        localStorage.setItem('clubsync_dark', String(next));
        toast.success(next ? 'Dark mode enabled (theme coming soon)' : 'Light mode enabled');
    };

    const profileFields = [
        { label: 'Name', value: user?.name, icon: User },
        { label: 'Email', value: user?.email, icon: Mail },
        { label: 'Role', value: user?.role, icon: Shield },
        ...(user?.role === 'Club' ? [{ label: 'Club Name', value: user?.clubName, icon: Building2 }] : []),
        ...(user?.role === 'Student' ? [
            { label: 'Roll No', value: user?.rollNo, icon: Hash },
            { label: 'Department', value: user?.department, icon: Building2 },
        ] : []),
        ...(user?.department && user?.role !== 'Student' ? [{ label: 'Department', value: user?.department, icon: Building2 }] : []),
    ];

    const notifOptions = [
        { key: 'newApplications', label: 'New Applications', desc: 'Get notified when a student applies to your club' },
        { key: 'logbookSubmissions', label: 'Logbook Submissions', desc: 'Alerts when students submit logbook entries' },
        { key: 'eventReminders', label: 'Event Reminders', desc: 'Reminders before upcoming club events' },
        { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of club activity' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className={`${cardClass} p-2 lg:col-span-1 h-fit`}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === t.id
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}>
                            <t.icon size={18} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="lg:col-span-3 space-y-4">
                    {tab === 'profile' && (
                        <div className={`${cardClass} p-6`}>
                            <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                                <User size={18} className="text-teal-600" /> Profile Information
                            </h3>
                            <div className="space-y-4">
                                {profileFields.map((f, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                            <f.icon size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{f.label}</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{f.value || '—'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-4">
                                Contact your administrator to update profile information.
                            </p>
                        </div>
                    )}

                    {tab === 'security' && (
                        <div className={`${cardClass} p-6`}>
                            <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                                <Lock size={18} className="text-teal-600" /> Change Password
                            </h3>
                            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            value={currentPwd}
                                            onChange={e => setCurrentPwd(e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400 transition-colors pr-10"
                                            placeholder="Enter current password"
                                        />
                                        <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={newPwd}
                                            onChange={e => setNewPwd(e.target.value)}
                                            required minLength={6}
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400 transition-colors pr-10"
                                            placeholder="At least 6 characters"
                                        />
                                        <button type="button" onClick={() => setShowNew(!showNew)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPwd}
                                        onChange={e => setConfirmPwd(e.target.value)}
                                        required minLength={6}
                                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400 transition-colors"
                                        placeholder="Re-enter new password"
                                    />
                                    {confirmPwd && newPwd && (
                                        <p className={`text-xs mt-1 font-medium ${newPwd === confirmPwd ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {newPwd === confirmPwd ? '✓ Passwords match' : '✗ Passwords do not match'}
                                        </p>
                                    )}
                                </div>
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200 disabled:opacity-60">
                                    {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                                    Update Password
                                </button>
                            </form>
                        </div>
                    )}

                    {tab === 'notifications' && (
                        <div className={`${cardClass} p-6`}>
                            <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                                <Bell size={18} className="text-teal-600" /> Notification Preferences
                            </h3>
                            <div className="space-y-3">
                                {notifOptions.map(opt => (
                                    <div key={opt.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleNotif(opt.key)}
                                            className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${notifPrefs[opt.key] ? 'bg-teal-500' : 'bg-gray-300'
                                                }`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform duration-200 ${notifPrefs[opt.key] ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Preferences are saved automatically.
                            </p>
                        </div>
                    )}

                    {tab === 'appearance' && (
                        <div className={`${cardClass} p-6`}>
                            <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                                <Palette size={18} className="text-teal-600" /> Appearance
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Dark Mode</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Switch between light and dark themes</p>
                                </div>
                                <button
                                    onClick={toggleDark}
                                    className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${darkMode ? 'bg-teal-500' : 'bg-gray-300'
                                        }`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform duration-200 ${darkMode ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-xs text-amber-700 font-medium">
                                    🎨 Theme customization is a work in progress. Your preference is saved and will take effect when theming is fully implemented.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
