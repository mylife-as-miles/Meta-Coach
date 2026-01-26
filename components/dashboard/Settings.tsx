import React, { useState } from 'react';
import AccountSettings from './settings/AccountSettings';
import TeamSettings from './settings/TeamSettings';
import DataSourcesSettings from './settings/DataSourcesSettings';
import NotificationSettings from './settings/NotificationSettings';

type SettingsView = 'account' | 'team' | 'data' | 'notifications' | 'ai';

const Settings: React.FC = () => {
    const [activeView, setActiveView] = useState<SettingsView>('account');

    return (
        <div className="flex flex-col min-h-[calc(100vh-90px)]">
            <div className="grid grid-cols-12 gap-8 h-full">
                {/* Secondary Sidebar (Settings Nav) */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-2">
                    <div className="bg-surface-dark rounded-2xl border border-white/10 p-2 shadow-lg">
                        <nav className="flex flex-col gap-1">
                            <button
                                onClick={() => setActiveView('account')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition w-full text-left font-medium text-sm group ${activeView === 'account'
                                        ? 'bg-primary/10 border border-primary/20 text-white shadow-[0_0_10px_rgba(210,249,111,0.05)]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl transition ${activeView === 'account' ? 'text-primary' : 'group-hover:text-primary'}`}>manage_accounts</span>
                                <span className={activeView === 'account' ? 'text-primary' : ''}>Account</span>
                            </button>

                            <button
                                onClick={() => setActiveView('team')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition w-full text-left font-medium text-sm group ${activeView === 'team'
                                        ? 'bg-primary/10 border border-primary/20 text-white shadow-[0_0_10px_rgba(210,249,111,0.05)]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl transition ${activeView === 'team' ? 'text-primary' : 'group-hover:text-primary'}`}>groups</span>
                                <span className={activeView === 'team' ? 'text-primary' : ''}>Team Configuration</span>
                            </button>

                            <button
                                onClick={() => setActiveView('data')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition w-full text-left font-medium text-sm group ${activeView === 'data'
                                        ? 'bg-primary/10 border border-primary/20 text-white shadow-[0_0_10px_rgba(210,249,111,0.05)]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl transition ${activeView === 'data' ? 'text-primary' : 'group-hover:text-primary'}`}>database</span>
                                <span className={activeView === 'data' ? 'text-primary' : ''}>Data Sources</span>
                            </button>

                            <button
                                onClick={() => setActiveView('notifications')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition w-full text-left font-medium text-sm group ${activeView === 'notifications'
                                        ? 'bg-primary/10 border border-primary/20 text-white shadow-[0_0_10px_rgba(210,249,111,0.05)]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl transition ${activeView === 'notifications' ? 'text-primary' : 'group-hover:text-primary'}`}>notifications</span>
                                <span className={activeView === 'notifications' ? 'text-primary' : ''}>Notifications</span>
                            </button>

                            <button
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition w-full text-left font-medium text-sm group cursor-not-allowed opacity-50"
                                disabled
                            >
                                <span className="material-symbols-outlined text-xl group-hover:text-primary transition">tune</span>
                                <span>AI Calibration</span>
                            </button>
                        </nav>
                    </div>
                    <div className="bg-surface-dark rounded-2xl border border-white/10 p-5 mt-4">
                        <h4 className="text-xs font-mono text-gray-500 uppercase mb-4">Subscription Status</h4>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-bold">Pro Enterprise</span>
                            <span className="text-primary text-xs bg-primary/10 px-2 py-0.5 rounded border border-primary/20">ACTIVE</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2">
                            <div className="bg-primary h-1.5 rounded-full w-[75%] shadow-neon"></div>
                        </div>
                        <p className="text-[10px] text-gray-400">Next billing cycle: <span className="text-white">Oct 24, 2024</span></p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <section className="col-span-12 lg:col-span-9">
                    {activeView === 'account' && <AccountSettings />}
                    {activeView === 'team' && <TeamSettings />}
                    {activeView === 'data' && <DataSourcesSettings />}
                    {activeView === 'notifications' && <NotificationSettings />}
                </section>
            </div>
        </div>
    );
};

export default Settings;
