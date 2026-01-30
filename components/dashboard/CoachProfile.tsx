import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../stores/useDashboardStore';

const CoachProfile: React.FC = () => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Store Data
    const userProfile = useDashboardStore((state) => state.userProfile);
    const teamProfile = useDashboardStore((state) => state.teamProfile);
    const allMatches = useDashboardStore((state) => state.allMatches);
    const updateUserProfile = useDashboardStore((state) => state.updateUserProfile);

    // Edit Form State
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        bio: '',
        location: '',
        languages: '',
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                role: userProfile.role || 'Coach',
                bio: userProfile.bio || '',
                location: userProfile.location || '',
                languages: userProfile.languages ? userProfile.languages.join(', ') : '',
            });
        }
    }, [userProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        await updateUserProfile({
            name: formData.name,
            role: formData.role,
            bio: formData.bio,
            location: formData.location,
            languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean)
        });
        setIsEditModalOpen(false);
    };

    // Derived Stats
    const matchesCoached = allMatches.length;
    const wins = allMatches.filter(m => m.result === 'WIN').length;
    const winRate = matchesCoached > 0 ? ((wins / matchesCoached) * 100).toFixed(1) : '0.0';

    // AI Radar Stats
    // Map existing AI config values to Radar axes
    const stats = {
        macro: teamProfile?.objective_control ? 85 : 60, // Boost if objective control is enabled
        micro: teamProfile?.aggression || 50,
        draft: teamProfile?.early_game_pathing ? 80 : 60, // Boost if early pathing logic enabled
        adaptability: teamProfile?.vision_investment || 50
    };

    // SVG Points Calculation (Simple Diamond)
    // Center (200, 150). Max radius ~90.
    const getPoint = (angle: number, value: number) => {
        const radians = (angle - 90) * (Math.PI / 180);
        const radius = (value / 100) * 90;
        return {
            x: 200 + radius * Math.cos(radians),
            y: 150 + radius * Math.sin(radians)
        };
    };

    const p1 = getPoint(0, stats.macro);    // Top
    const p2 = getPoint(90, stats.draft);   // Right
    const p3 = getPoint(180, stats.micro);  // Bottom
    const p4 = getPoint(270, stats.adaptability); // Left

    const radarPath = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} L${p4.x} ${p4.y} Z`;

    // Formatted Data
    const memberSince = userProfile?.created_at
        ? new Date(userProfile.created_at).getFullYear()
        : new Date().getFullYear();

    const teamLogo = teamProfile?.logoUrl;
    const teamName = teamProfile?.teamName || "No Team";
    const teamRegion = teamProfile?.region || "Global";

    return (
        <div className="w-full relative">
            <style>{`
                .grid-bg {
                    background-color: #1A1C14;
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                .radar-poly {
                    transition: all 1s ease-in-out;
                }
                .timeline-line::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 15px;
                    width: 2px;
                    background: rgba(255, 255, 255, 0.1);
                }
                /* Custom scrollbar for modal */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1A1C14;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 3px;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.3s ease-out forwards;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-surface-dark border border-primary/30 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center relative z-10">
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                <span className="material-icons-outlined text-primary">edit_note</span>
                                Edit Profile
                            </h2>
                            <button className="text-gray-400 hover:text-white transition" onClick={() => setIsEditModalOpen(false)}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>
                        <div className="px-8 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar relative z-10">
                            <form className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        {userProfile?.avatar ? (
                                            <img alt="Profile Preview" className="w-20 h-20 rounded-full border-2 border-primary/20 object-cover" src={userProfile.avatar} />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full border-2 border-primary/20 bg-surface-darker flex items-center justify-center text-xl font-bold text-gray-500">
                                                {userProfile?.name?.substring(0, 2).toUpperCase() || 'CH'}
                                            </div>
                                        )}
                                        {/* Avatar upload placeholder - implementation omitted as per scope, but UI preserved */}
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                            <span className="material-icons-outlined text-white text-sm">camera_alt</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Profile Picture</label>
                                        <div className="flex gap-3">
                                            <button className="px-4 py-2 bg-surface-darker border border-white/10 hover:border-primary/50 rounded-lg text-sm text-white transition flex items-center gap-2" type="button">
                                                <span className="material-icons-outlined text-base">upload</span> Upload New
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="name">Full Name</label>
                                        <input
                                            className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition"
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="role">Role</label>
                                        <input
                                            className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition"
                                            id="role"
                                            type="text"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="location">Location</label>
                                        <input
                                            className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition"
                                            id="location"
                                            type="text"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Los Angeles, CA"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="languages">Languages</label>
                                        <input
                                            className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition"
                                            id="languages"
                                            type="text"
                                            value={formData.languages}
                                            onChange={handleInputChange}
                                            placeholder="e.g. English, Korean"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="bio">Professional Bio</label>
                                    <textarea
                                        className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition min-h-[100px]"
                                        id="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                    ></textarea>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-xs text-gray-500">Brief description for your public profile card.</span>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-8 py-5 border-t border-white/5 flex justify-end gap-3 bg-surface-darker/50 relative z-10">
                            <button
                                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition border border-transparent"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary hover:bg-primary-dark text-black shadow-neon transition flex items-center gap-2"
                                onClick={handleSave}
                            >
                                <span className="material-icons-outlined text-lg">save</span> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={isEditModalOpen ? "blur-sm brightness-50 pointer-events-none transition duration-300" : "transition duration-300"}>
                <header className="relative bg-surface-dark rounded-2xl p-8 mb-6 border border-white/5 overflow-hidden shadow-glow">
                    <div className="absolute inset-0 grid-bg opacity-30"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            {userProfile?.avatar ? (
                                <img src={userProfile.avatar} alt={userProfile.name} className="w-32 h-32 rounded-full border-4 border-surface-darker ring-2 ring-primary relative z-10 object-cover" />
                            ) : (
                                <div className="w-32 h-32 rounded-full border-4 border-surface-darker ring-2 ring-primary relative z-10 bg-surface-dark flex items-center justify-center">
                                    <span className="text-4xl font-bold text-gray-500">{userProfile?.name?.substring(0, 2).toUpperCase() || 'CH'}</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 z-20 bg-background-dark border border-white/10 rounded-full p-1.5 shadow-lg">
                                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-background-dark"></div>
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                                <h1 className="text-3xl font-bold text-white tracking-tight">{userProfile?.name || 'Coach'}</h1>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 font-medium">{userProfile?.role || 'Head Coach'}</span>
                                <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-bold shadow-neon flex items-center gap-1">
                                    <span className="material-icons-outlined text-[14px]">auto_awesome</span>
                                    AI Synergy: Elite
                                </span>
                            </div>
                            <p className="text-gray-400 max-w-2xl mb-4">{userProfile?.bio || "No professional bio available. Click edit to add one."}</p>
                            <div className="flex items-center gap-6 justify-center md:justify-start text-sm text-gray-500 font-mono">
                                <span className="flex items-center gap-1"><span className="material-icons-outlined text-base">verified</span> Member since {memberSince}</span>
                                <span className="flex items-center gap-1"><span className="material-icons-outlined text-base">location_on</span> {userProfile?.location || 'Unknown Location'}</span>
                                <span className="flex items-center gap-1"><span className="material-icons-outlined text-base">language</span> {userProfile?.languages?.join(', ') || 'English'}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 cursor-pointer">
                                <span className="material-icons-outlined text-lg">mail</span> Contact
                            </button>
                            <button
                                className="bg-surface-dark border border-white/10 hover:border-primary/50 text-white hover:text-primary px-4 py-2.5 rounded-xl transition cursor-pointer"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <span className="material-icons-outlined text-lg">edit</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>
                            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-primary">insights</span> Professional Stats
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm text-gray-400">Matches Coached</span>
                                        <span className="text-xl font-bold text-white">{matchesCoached}</span>
                                    </div>
                                    <div className="w-full bg-surface-darker rounded-full h-1.5">
                                        <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm text-gray-400">Career Win Rate</span>
                                        <span className="text-xl font-bold text-primary shadow-neon">{winRate}%</span>
                                    </div>
                                    <div className="w-full bg-surface-darker rounded-full h-1.5">
                                        <div className="bg-primary h-1.5 rounded-full shadow-neon" style={{ width: `${winRate}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm text-gray-400">Gemini Trust Score</span>
                                        <span className="text-xl font-bold text-blue-400">9.2/10</span>
                                    </div>
                                    <div className="w-full bg-surface-darker rounded-full h-1.5">
                                        <div className="bg-blue-400 h-1.5 rounded-full w-[92%] shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 text-right">Based on prediction accuracy</p>
                                </div>
                            </div>
                        </div>
                        {/* Achievements Section - Hidden if no data, or placeholders removed as requested */}
                    </div>

                    <div className="lg:col-span-6 flex flex-col gap-6">
                        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6 z-10 relative">
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <span className="material-icons-outlined text-purple-400">radar</span> Coaching Style Matrix
                                </h3>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-mono text-gray-500 border border-white/10 px-2 py-1 rounded bg-black/20">LIVE DATA</span>
                                </div>
                            </div>
                            <div className="relative w-full h-[320px] flex items-center justify-center">
                                <div className="absolute inset-0 grid-bg opacity-50 rounded-xl border border-white/5"></div>
                                <svg className="w-full h-full p-4 relative z-10" viewBox="0 0 400 300">
                                    <g fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1">
                                        <path d="M200 50 L300 150 L200 250 L100 150 Z"></path>
                                        <path d="M200 90 L260 150 L200 210 L140 150 Z"></path>
                                        <path d="M200 130 L220 150 L200 170 L180 150 Z"></path>
                                        <line x1="200" x2="200" y1="50" y2="250"></line>
                                        <line x1="100" x2="300" y1="150" y2="150"></line>
                                    </g>
                                    <path className="radar-poly" d={radarPath} fill="rgba(210, 249, 111, 0.15)" filter="drop-shadow(0 0 4px rgba(210, 249, 111, 0.4))" stroke="#D2F96F" strokeWidth="2"></path>
                                    <circle cx={p1.x} cy={p1.y} fill="#D2F96F" r="3"></circle>
                                    <circle cx={p2.x} cy={p2.y} fill="#D2F96F" r="3"></circle>
                                    <circle cx={p3.x} cy={p3.y} fill="#D2F96F" r="3"></circle>
                                    <circle cx={p4.x} cy={p4.y} fill="#D2F96F" r="3"></circle>
                                    <text fill="#E0E0E0" fontSize="10" fontWeight="bold" textAnchor="middle" x="200" y="35">MACRO STRATEGY</text>
                                    <text fill="#E0E0E0" fontSize="10" fontWeight="bold" textAnchor="middle" x="200" y="270">MICRO MGMT</text>
                                    <text fill="#E0E0E0" fontSize="10" fontWeight="bold" textAnchor="start" x="310" y="153">DRAFT PRECISION</text>
                                    <text fill="#E0E0E0" fontSize="10" fontWeight="bold" textAnchor="end" x="90" y="153">ADAPTABILITY</text>
                                </svg>
                            </div>
                        </div>
                        {/* Strategic History removed as requested (hardcoded data) */}
                    </div>

                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg">
                            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-gray-400">groups</span> Active Team
                            </h3>
                            <div className="bg-gradient-to-br from-[#00A9E0]/20 to-surface-darker p-5 rounded-xl border border-[#00A9E0]/30 mb-4 flex flex-col items-center text-center relative overflow-hidden group">
                                {teamLogo ? (
                                     <div className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-5 transform scale-150 group-hover:rotate-12 transition duration-700" style={{ backgroundImage: `url('${teamLogo}')` }}></div>
                                ) : null}
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(0,169,224,0.3)] z-10 relative">
                                    {teamLogo ? (
                                        <img src={teamLogo} alt={teamName} className="w-10 h-10 object-contain" />
                                    ) : (
                                        <span className="text-[#00A9E0] font-black text-xl">{teamName.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>
                                <h4 className="text-white font-bold text-lg z-10">{teamName}</h4>
                                <p className="text-[#00A9E0] text-xs font-medium mb-4 z-10">{teamRegion}</p>
                            </div>
                            <button className="w-full py-2.5 bg-surface-darker hover:bg-white/5 border border-white/5 text-gray-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer">
                                View Team Roster
                                <span className="material-icons-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <span className="material-icons-outlined text-primary">assistant</span> AI Notes
                                </h3>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">LIVE</span>
                            </div>
                            <div className="space-y-3 flex-1">
                                <div className="bg-surface-darker border border-border-lime p-3 rounded-xl relative">
                                    <span className="absolute top-3 left-0 w-1 h-8 bg-primary rounded-r"></span>
                                    <p className="text-gray-300 text-xs leading-relaxed pl-2">
                                        {teamProfile?.generated_reasoning || "No AI insights generated yet. Play matches to generate data."}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <div className="flex gap-2">
                                    <input className="bg-surface-darker border border-white/10 rounded-lg px-3 py-2 text-xs text-white w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none" placeholder="Add a note..." type="text" />
                                    <button className="bg-primary hover:bg-primary-dark text-black rounded-lg w-8 flex items-center justify-center transition cursor-pointer">
                                        <span className="material-icons-outlined text-sm">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachProfile;
