import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { DashboardProvider } from '../../context/DashboardContext';
import supabase from '../../lib/supabase';

const NavItem = ({ to, children, end = false }: { to: string, children: React.ReactNode, end?: boolean }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            isActive
                ? "px-5 py-2 rounded-full bg-primary text-black font-semibold text-sm transition shadow-neon"
                : "px-5 py-2 rounded-full text-gray-400 hover:text-white font-medium text-sm transition"
        }
    >
        {children}
    </NavLink>
);

const DashboardLayout: React.FC = () => {
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [showProfileMenu, setShowProfileMenu] = React.useState(false);
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/login'); // Assuming /login is the auth page
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <DashboardProvider>
            <div className="bg-background-dark text-text-light font-sans min-h-screen relative">
                {/* Backdrop Overlay */}
                {showNotifications && (
                    <div
                        className="fixed inset-0 bg-[#0E100A]/70 backdrop-blur-[2px] z-40 transition-opacity duration-300"
                        onClick={() => setShowNotifications(false)}
                    ></div>
                )}

                <nav className="flex items-center justify-between px-4 md:px-6 py-5 bg-transparent w-full max-w-[1600px] mx-auto relative z-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transform rotate-45 shadow-neon">
                            <span className="material-icons-outlined text-black transform -rotate-45 text-lg">sports_esports</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">MetaCoach</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center bg-surface-dark rounded-full p-1.5 shadow-sm border border-white/5">
                        <NavItem to="/dashboard" end>Dashboard</NavItem>
                        <NavItem to="/dashboard/match-history">Match History</NavItem>
                        <NavItem to="/dashboard/player-hub">Player Hub</NavItem>
                        <NavItem to="/dashboard/strategy-lab">Strategy Lab</NavItem>
                        <NavItem to="/dashboard/settings">Settings</NavItem>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Mobile Menu Toggle */}
                        <div className="lg:hidden relative group">
                            <button className="w-10 h-10 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition peer">
                                <span className="material-icons-outlined">menu</span>
                            </button>
                            {/* Mobile Dropdown */}
                            <div className="absolute top-full right-0 mt-2 w-56 bg-[#1A1C14] border border-white/10 rounded-xl shadow-2xl overflow-hidden hidden peer-focus-within:block hover:block z-50">
                                <div className="flex flex-col p-2 space-y-1">
                                    <NavLink to="/dashboard" end className={({ isActive }) => `px-4 py-3 rounded-lg text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Dashboard</NavLink>
                                    <NavLink to="/dashboard/match-history" className={({ isActive }) => `px-4 py-3 rounded-lg text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Match History</NavLink>
                                    <NavLink to="/dashboard/player-hub" className={({ isActive }) => `px-4 py-3 rounded-lg text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Player Hub</NavLink>
                                    <NavLink to="/dashboard/strategy-lab" className={({ isActive }) => `px-4 py-3 rounded-lg text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Strategy Lab</NavLink>
                                    <NavLink to="/dashboard/settings" className={({ isActive }) => `px-4 py-3 rounded-lg text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>Settings</NavLink>
                                    <div className="h-px bg-white/10 my-1 mx-2"></div>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-left px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>


                        {/* Notification Button & Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition relative ${showNotifications
                                    ? 'bg-surface-dark border border-primary text-primary shadow-[0_0_10px_rgba(210,249,111,0.3)]'
                                    : 'bg-surface-dark border border-white/10 text-gray-400 hover:text-primary hover:border-primary/50'
                                    }`}
                            >
                                <span className="material-icons-outlined text-sm">notifications</span>
                                <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-primary rounded-full shadow-neon"></span>
                            </button>

                            {showNotifications && (
                                <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-[#1A1C14] border border-[#D2F96F]/30 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_15px_rgba(210,249,111,0.1)] overflow-hidden animate-fade-in backdrop-blur-xl z-50">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#141610]">
                                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                            AI Coaching Alerts
                                            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] border border-primary/20">3 NEW</span>
                                        </h3>
                                        <button className="text-[10px] text-gray-400 hover:text-primary transition font-mono">Mark all read</button>
                                    </div>
                                    <div className="flex flex-col max-h-[400px] overflow-y-auto">
                                        <div className="p-4 border-b border-white/5 hover:bg-white/5 transition cursor-pointer relative group bg-gradient-to-r from-primary/5 to-transparent">
                                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary shadow-neon"></div>
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#141610] border border-primary/30 flex items-center justify-center shrink-0 group-hover:border-primary/60 transition shadow-neon">
                                                    <span className="material-icons-outlined text-sm text-red-400">warning</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-white leading-snug group-hover:text-primary transition">New micro-mistake detected for Blaber</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 font-mono">2 mins ago • Jungle Pathing</p>
                                                </div>
                                                <span className="w-2 h-2 rounded-full bg-primary shadow-neon mt-1.5 shrink-0"></span>
                                            </div>
                                        </div>
                                        <div className="p-4 border-b border-white/5 hover:bg-white/5 transition cursor-pointer relative group bg-gradient-to-r from-primary/5 to-transparent">
                                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary shadow-neon"></div>
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#141610] border border-primary/30 flex items-center justify-center shrink-0 group-hover:border-primary/60 transition shadow-neon">
                                                    <span className="material-icons-outlined text-sm text-primary">bolt</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-white leading-snug group-hover:text-primary transition">Strategy Shift: Baron objective now high priority</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 font-mono">12 mins ago • Macro AI</p>
                                                </div>
                                                <span className="w-2 h-2 rounded-full bg-primary shadow-neon mt-1.5 shrink-0"></span>
                                            </div>
                                        </div>
                                        <div className="p-4 hover:bg-white/5 transition cursor-pointer relative group">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#141610] border border-white/10 flex items-center justify-center shrink-0 group-hover:border-white/30 transition">
                                                    <span className="material-icons-outlined text-sm text-blue-400">analytics</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-gray-300 leading-snug group-hover:text-white transition">Match analysis for vs G2 Esports is ready</p>
                                                    <p className="text-[10px] text-gray-500 mt-1 font-mono">1 hour ago • Post-Match</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 border-t border-white/5 bg-[#141610] text-center">
                                        <Link
                                            to="/dashboard/communication-logs"
                                            onClick={() => setShowNotifications(false)}
                                            className="text-[10px] uppercase tracking-wider font-bold text-gray-500 hover:text-white py-1.5 w-full transition block"
                                        >
                                            View All History
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative z-30 ml-2 pl-2 border-l border-white/10">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
                            >
                                <div className="w-9 h-9 rounded-full border-2 border-surface-dark ring-2 ring-primary/20 bg-primary flex items-center justify-center overflow-hidden">
                                    <span className="font-bold text-black text-xs">AC</span>
                                </div>
                                <div className="hidden lg:block text-xs text-left">
                                    <p className="text-white font-medium">Alex Chen</p>
                                    <p className="text-gray-400">Head Coach</p>
                                </div>
                                <span className={`material-icons-outlined text-gray-500 text-sm hidden lg:block transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>

                            {/* Profile Dropdown */}
                            {showProfileMenu && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A1C14] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                                    <div className="p-1">
                                        <Link
                                            to="/dashboard/profile"
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition"
                                        >
                                            <span className="material-icons-outlined text-sm">person</span>
                                            Profile
                                        </Link>
                                        <Link
                                            to="/dashboard/settings"
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition"
                                        >
                                            <span className="material-icons-outlined text-sm">settings</span>
                                            Settings
                                        </Link>
                                        <div className="h-px bg-white/10 my-1"></div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition"
                                        >
                                            <span className="material-icons-outlined text-sm">logout</span>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                <main className="px-4 md:px-6 pb-10 w-full max-w-[1600px] mx-auto relative z-10">
                    <Outlet />
                </main>
            </div>
        </DashboardProvider>
    );
};

export default DashboardLayout;
