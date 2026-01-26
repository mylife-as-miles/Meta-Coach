import React from 'react';

const NotificationSettings: React.FC = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="bg-surface-dark rounded-2xl border border-white/10 p-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-transparent to-transparent opacity-50"></div>
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Notification Preferences</h2>
                        <p className="text-sm text-gray-400">Customize how and when MetaCoach alerts you.</p>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition flex items-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                        Reset to Default
                    </button>
                </div>

                {/* AI Coaching Alerts */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">psychology</span>
                        AI Coaching Alerts
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/[0.02] transition">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">Real-time Micro-Mistakes</span>
                                <span className="text-xs text-gray-500">Get instant feedback on mechanical errors and positioning.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/[0.02] transition">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">Strategic Macro Shifts</span>
                                <span className="text-xs text-gray-500">Alerts for map rotation opportunities and objective trade-offs.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">Win-Probability Changes</span>
                                <span className="text-xs text-gray-500">Notifications when win chance swings by {'>'}15%.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Team Activity */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Team Activity
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/[0.02] transition">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">Roster Changes</span>
                                <span className="text-xs text-gray-500">Updates on player substitutions and role swaps.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">New Match Data Synced</span>
                                <span className="text-xs text-gray-500">Notify when scrim or tournament data finishes processing.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* General */}
                <div className="">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">settings_applications</span>
                        General
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/[0.02] transition">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">System Updates</span>
                                <span className="text-xs text-gray-500">Changelogs, patch notes, and maintenance alerts.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">Billing</span>
                                <span className="text-xs text-gray-500">Invoices, renewal reminders, and payment confirmations.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
