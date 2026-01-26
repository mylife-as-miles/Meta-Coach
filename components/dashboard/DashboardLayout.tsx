import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

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
    return (
        <div className="bg-background-dark text-text-light font-sans min-h-screen">
            <nav className="flex items-center justify-between px-6 py-5 bg-transparent w-full max-w-[1600px] mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transform rotate-45 shadow-neon">
                        <span className="material-icons-outlined text-black transform -rotate-45 text-lg">sports_esports</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">MetaCoach</span>
                </div>

                <div className="hidden md:flex items-center bg-surface-dark rounded-full p-1.5 shadow-sm border border-white/5">
                    <NavItem to="/dashboard" end>Dashboard</NavItem>
                    <NavItem to="/dashboard/match-history">Match History</NavItem>
                    <NavItem to="/dashboard/player-hub">Player Hub</NavItem>
                    <NavItem to="/dashboard/strategy-lab">Strategy Lab</NavItem>
                    <NavItem to="/dashboard/settings">Settings</NavItem>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search button removed */}
                    <button className="w-10 h-10 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 transition relative">
                        <span className="material-icons-outlined text-sm">notifications</span>
                        <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-primary rounded-full shadow-neon"></span>
                    </button>
                    <div className="flex items-center gap-3 pl-2 border-l border-white/10 ml-2">
                        <img
                            alt="Profile"
                            className="w-9 h-9 rounded-full border-2 border-surface-dark ring-2 ring-primary/20"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnZHcSrpkq-4S4qmJXdr6_VhmwSYKTgBwySukjrnGqn8M8DPxDi-_T89gMvPjZJuk5_YnTIKw4EKg0qcJLf5m9Bt-dXlPiBq2kKdwYXHZTaOlCgsFapA1gpGLbBNZ5_-MITHR2kuaqWAzhqxlkrEJ21e6rhziCrRwoZu9BRP_WmTwNzPz1Q9vIcYV5_dAJqKG6SXpWb7DxmTtCkQbEXLcIaXyMBNx34AFE2Hfk8o7S1p-4J0HIXtEmVWCEuRn8PAe7U9GsA4ysQNo"
                        />
                        <div className="hidden lg:block text-xs">
                            <p className="text-white font-medium">Alex Chen</p>
                            <p className="text-gray-400">Head Coach</p>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="px-6 pb-10 w-full max-w-[1600px] mx-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
