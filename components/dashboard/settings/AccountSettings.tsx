import React from 'react';

const AccountSettings: React.FC = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="bg-surface-dark rounded-2xl border border-white/10 p-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-transparent to-transparent opacity-50"></div>
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Account Settings</h2>
                        <p className="text-sm text-gray-400">Manage your profile information and account security.</p>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition flex items-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Sign Out
                    </button>
                </div>

                {/* Profile Information */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Profile Information
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-4 col-span-1 md:col-span-2 mb-2">
                                <img alt="Profile" className="w-16 h-16 rounded-full border-2 border-surface-dark ring-2 ring-primary/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnZHcSrpkq-4S4qmJXdr6_VhmwSYKTgBwySukjrnGqn8M8DPxDi-_T89gMvPjZJuk5_YnTIKw4EKg0qcJLf5m9Bt-dXlPiBq2kKdwYXHZTaOlCgsFapA1gpGLbBNZ5_-MITHR2kuaqWAzhqxlkrEJ21e6rhziCrRwoZu9BRP_WmTwNzPz1Q9vIcYV5_dAJqKG6SXpWb7DxmTtCkQbEXLcIaXyMBNx34AFE2Hfk8o7S1p-4J0HIXtEmVWCEuRn8PAe7U9GsA4ysQNo" />
                                <button className="text-sm text-primary hover:text-primary-dark font-medium transition cursor-pointer">Change Avatar</button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                                <input className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-600 transition" type="text" defaultValue="MetaCoach Admin" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                <input className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-600 transition" type="email" defaultValue="admin@metacoach.gg" />
                            </div>
                            <div className="col-span-1 md:col-span-2 pt-2">
                                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition flex items-center gap-2 w-fit cursor-pointer">
                                    <span className="material-symbols-outlined text-sm">lock_reset</span>
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security */}
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
                                <input defaultChecked className="sr-only peer" type="checkbox" />
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
                            <button className="px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 text-sm font-medium transition shadow-sm whitespace-nowrap cursor-pointer">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-3">
                    <button className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-medium transition cursor-pointer">Discard Changes</button>
                    <button className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black text-sm font-bold shadow-neon transition transform hover:-translate-y-0.5 cursor-pointer">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
