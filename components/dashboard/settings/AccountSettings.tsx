import React, { useState, useEffect } from 'react';
import { useSession, useProfile } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

const AccountSettings: React.FC = () => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { data: profile, isLoading, refetch } = useProfile(userId);

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initialize state from profile/session
    useEffect(() => {
        if (session?.user?.email) setEmail(session.user.email);
        if (profile) {
            setDisplayName(profile.display_name || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [session, profile]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setMessage(null);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/${Math.random()}.${fileExt}`;

            // Upload via Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // Auto-save avatar reference to profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl, updated_at: new Date() })
                .eq('id', userId);

            if (updateError) throw updateError;

            refetch(); // Refresh profile data
            setMessage({ type: 'success', text: 'Avatar updated successfully!' });

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            setMessage({ type: 'error', text: error.message || 'Error uploading avatar' });
        } finally {
            setUploading(false);
        }
    };

    const handleSaveChanges = async () => {
        try {
            setSaving(true);
            setMessage(null);

            const updates = {
                id: userId,
                display_name: displayName,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;

            refetch();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) return;
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password reset email sent!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-surface-dark rounded-2xl border border-white/10 p-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-transparent to-transparent opacity-50"></div>

                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Account Settings</h2>
                        <p className="text-sm text-gray-400">Manage your profile information and account security.</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition flex items-center gap-2 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Sign Out
                    </button>
                </div>

                {/* Feedback Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Information */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Profile Information
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Avatar Section */}
                            <div className="flex items-center gap-4 col-span-1 md:col-span-2 mb-2">
                                <div className="relative group">
                                    <img
                                        alt="Profile"
                                        className="w-16 h-16 rounded-full border-2 border-surface-dark ring-2 ring-primary/20 object-cover"
                                        src={avatarUrl || `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=D2F96F&color=000`}
                                    />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                            <span className="material-icons animate-spin text-white text-xs">refresh</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="avatar-upload" className="text-sm text-primary hover:text-primary-dark font-medium transition cursor-pointer">
                                        {uploading ? 'Uploading...' : 'Change Avatar'}
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                                <input
                                    className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-600 transition"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                <input
                                    className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2.5 text-gray-400 cursor-not-allowed"
                                    type="email"
                                    value={email}
                                    disabled
                                    title="Email cannot be changed directly"
                                />
                            </div>

                            {/* Password Reset */}
                            <div className="col-span-1 md:col-span-2 pt-2">
                                <button
                                    onClick={handlePasswordReset}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition flex items-center gap-2 w-fit cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">lock_reset</span>
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security (Static for now, but functional toggle UI) */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">security</span>
                        Security
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">Two-Factor Authentication</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">RECOMMENDED</span>
                                </div>
                                <span className="text-xs text-gray-500">Add an extra layer of security to your account by requiring a verification code.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input className="sr-only peer" type="checkbox" disabled />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="">
                    <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">warning</span>
                        Danger Zone
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-red-500/20 overflow-hidden relative">
                        <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 relative z-10">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">Delete Account</span>
                                <span className="text-xs text-gray-500 max-w-md">Permanently remove your account and all associated team data. This action cannot be undone.</span>
                            </div>
                            <button
                                onClick={() => alert('Please contact support to delete your account.')}
                                className="px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 text-sm font-medium transition shadow-sm whitespace-nowrap cursor-pointer"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={() => {
                            if (profile) {
                                setDisplayName(profile.display_name || '');
                                setAvatarUrl(profile.avatar_url || '');
                            }
                            setMessage(null);
                        }}
                        className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-medium transition cursor-pointer"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSaveChanges}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black text-sm font-bold shadow-neon transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
