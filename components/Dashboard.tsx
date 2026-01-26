import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type User, type Team } from '../lib/db';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [team, setTeam] = useState<Team | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                navigate('/auth');
                return;
            }
            const u = await db.users.get(parseInt(userId));
            if (!u) {
                navigate('/auth');
                return;
            }
            setUser(u);

            const t = await db.teams.where('userId').equals(u.id).first();
            setTeam(t || null);
        };
        loadData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('userId');
        navigate('/');
    };

    if (!user) return <div className="text-white p-10 bg-[#0E100A] min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen text-white font-sans selection:bg-primary selection:text-black">
             <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
            <nav className="relative z-10 border-b border-white/10 p-6 flex justify-between items-center backdrop-blur-sm bg-background-dark/80">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-black font-bold text-lg shadow-[0_0_10px_rgba(210,249,111,0.4)]">
                        <span className="material-icons text-sm">auto_graph</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">MetaCoach</span>
                </div>
                 <div className="flex items-center gap-4">
                     <span className="text-sm text-gray-400">v2.0.4 <span className="text-green-500">•</span></span>
                     <div className="h-4 w-px bg-white/10"></div>
                     <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">Log Out</button>
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500"></div>
                 </div>
            </nav>
            <main className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                        <p className="text-gray-400 mt-1">Welcome back, <span className="text-primary">{user.username}</span></p>
                    </div>
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                        <span className="material-icons text-sm">settings</span>
                        Configure Widgets
                    </button>
                </div>

                {team ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Team Status Card */}
                        <div className="bg-surface-dark border border-white/10 p-6 rounded-xl hover:border-primary/30 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <span className="material-icons">sports_esports</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-green-500 border border-green-500/20 bg-green-500/10 px-2 py-0.5 rounded">Active</span>
                            </div>
                            <h2 className="text-xl font-bold mb-1 text-white">{team.gameTitle}</h2>
                            <p className="text-sm text-gray-500 mb-4">Season 14 - Split 2</p>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Roster Status</span>
                                    <span className="text-white font-mono">{team.roster.filter(p => p).length}/5 Synced</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${(team.roster.filter(p => p).length / 5) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Strategy Profile Card */}
                        <div className="bg-surface-dark border border-white/10 p-6 rounded-xl hover:border-primary/30 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <span className="material-icons">psychology</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-blue-400 border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 rounded">AI Calibrated</span>
                            </div>
                            <h2 className="text-xl font-bold mb-1 text-white">Strategy Profile</h2>
                            <p className="text-sm text-gray-500 mb-4">Gemini Engine v2.0</p>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-white/5 p-2 rounded">
                                    <span className="block text-[10px] text-gray-500 uppercase">Aggression</span>
                                    <span className="block text-white font-mono">{team.strategy.aggression}%</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded">
                                    <span className="block text-[10px] text-gray-500 uppercase">Vision</span>
                                    <span className="block text-white font-mono">{team.strategy.visionInvestment}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Alerts Card */}
                        <div className="bg-surface-dark border border-white/10 p-6 rounded-xl hover:border-primary/30 transition-colors group relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                    <span className="material-icons">notifications_active</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">Just Now</span>
                            </div>
                            <h2 className="text-xl font-bold mb-1 text-white">System Alerts</h2>
                            <p className="text-sm text-gray-500 mb-4">2 New insights available</p>

                            <div className="space-y-2">
                                <div className="flex gap-2 items-center text-sm text-gray-300">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                    <span>Opponent data analysis complete</span>
                                </div>
                                <div className="flex gap-2 items-center text-sm text-gray-300">
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                    <span>Patch 14.3 meta shift detected</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-400 p-10 text-center border border-dashed border-white/10 rounded-xl">
                        <span className="material-icons text-4xl mb-4 text-gray-600">group_off</span>
                        <p className="mb-4">No team data found.</p>
                        <button
                            onClick={() => navigate('/onboarding/step-1')}
                            className="text-primary hover:text-black hover:bg-primary border border-primary px-4 py-2 rounded transition-all"
                        >
                            Start Onboarding
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
export default Dashboard;