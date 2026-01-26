import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';

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

    return (
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

                    <Link to="/dashboard/profile" className="flex items-center gap-3 pl-2 border-l border-white/10 ml-2 relative z-30 hover:opacity-80 transition cursor-pointer">
                        <img
                            alt="Profile"
                            className="w-9 h-9 rounded-full border-2 border-surface-dark ring-2 ring-primary/20"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnZHcSrpkq-4S4qmJXdr6_VhmwSYKTgBwySukjrnGqn8M8DPxDi-_T89gMvPjZJuk5_YnTIKw4EKg0qcJLf5m9Bt-dXlPiBq2kKdwYXHZTaOlCgsFapA1gpGLbBNZ5_-MITHR2kuaqWAzhxxlkrEJ21e6rhziCrRwoZu9BRP_WmTwNzPz1Q9vIcYV5_dAJqKG6SXpWb7DxmTtCkQbEXLcIaXyMBNx34AFE2Hfk8o7S1p-4J0HIXtEmVWCEuRn8PAe7U9GsA4ysQNo"
                        />
                        <div className="hidden lg:block text-xs">
                            <p className="text-white font-medium">Alex Chen</p>
                            <p className="text-gray-400">Head Coach</p>
                        </div>
                    </Link>
                </div>
            </nav>

            <main className="px-4 md:px-6 pb-10 w-full max-w-[1600px] mx-auto relative z-10">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
