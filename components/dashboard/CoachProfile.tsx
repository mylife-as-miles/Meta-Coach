import React from 'react';
import { useDashboardStore } from '../../stores/useDashboardStore';

const CoachProfile: React.FC = () => {
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const userProfile = useDashboardStore((state) => state.userProfile);

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
                                        <img alt="Profile Preview" className="w-20 h-20 rounded-full border-2 border-primary/20 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnZHcSrpkq-4S4qmJXdr6_VhmwSYKTgBwySukjrnGqn8M8DPxDi-_T89gMvPjZJuk5_YnTIKw4EKg0qcJLf5m9Bt-dXlPiBq2kKdwYXHZTaOlCgsFapA1gpGLbBNZ5_-MITHR2kuaqWAzhqxlkrEJ21e6rhziCrRwoZu9BRP_WmTwNzPz1Q9vIcYV5_dAJqKG6SXpWb7DxmTtCkQbEXLcIaXyMBNx34AFE2Hfk8o7S1p-4J0HIXtEmVWCEuRn8PAe7U9GsA4ysQNo" />
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
                                            <button className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition" type="button">Remove</button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Recommended: 400x400px JPG or PNG. Max 2MB.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="fullName">Full Name</label>
                                        <input className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition" id="fullName" type="text" defaultValue="Alex Chen" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="role">Role</label>
                                        <input className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition" id="role" type="text" defaultValue="Head Coach" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5" htmlFor="bio">Professional Bio</label>
                                    <textarea className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition min-h-[100px]" id="bio" defaultValue="Strategic mastermind specializing in macro-level play calling and adaptive drafting. Former pro player transitioning into data-driven coaching."></textarea>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-xs text-gray-500">Brief description for your public profile card.</span>
                                        <span className="text-xs text-gray-500">142/300</span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <span className="material-icons-outlined text-primary text-sm">tune</span> Coaching Preferences
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-surface-darker rounded-xl border border-white/5">
                                            <div>
                                                <p className="text-sm font-medium text-white">Public Profile Visibility</p>
                                                <p className="text-xs text-gray-500">Allow other teams to view your stats summary.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-surface-darker rounded-xl border border-white/5">
                                            <div>
                                                <p className="text-sm font-medium text-white">AI Analysis Integration</p>
                                                <p className="text-xs text-gray-500">Automatically sync Gemini insights to dashboard.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
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
                                onClick={() => setIsEditModalOpen(false)}
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
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 font-medium">Head Coach</span>
                                <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-bold shadow-neon flex items-center gap-1">
                                    <span className="material-icons-outlined text-[14px]">auto_awesome</span>
                                    AI Synergy: Elite
                                </span>
                            </div>
                            <p className="text-gray-400 max-w-2xl mb-4">Strategic mastermind specializing in macro-level play calling and adaptive drafting. Former pro player transitioning into data-driven coaching.</p>
                            <div className="flex items-center gap-6 justify-center md:justify-start text-sm text-gray-500 font-mono">
                                <span className="flex items-center gap-1"><span className="material-icons-outlined text-base">verified</span> Member since 2021</span>
                                <span className="flex items-center gap-1"><span class="material-icons-outlined text-base">location_on</span> Los Angeles, CA</span>
                                <span className="flex items-center gap-1"><span className="material-icons-outlined text-base">language</span> English, Korean</span>
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
                                        <span className="text-xl font-bold text-white">482</span>
                                    </div>
                                    <div className="w-full bg-surface-darker rounded-full h-1.5">
                                        <div className="bg-gray-500 h-1.5 rounded-full w-[80%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm text-gray-400">Career Win Rate</span>
                                        <span className="text-xl font-bold text-primary shadow-neon">68.4%</span>
                                    </div>
                                    <div className="w-full bg-surface-darker rounded-full h-1.5">
                                        <div className="bg-primary h-1.5 rounded-full w-[68%] shadow-neon"></div>
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
                        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg">
                            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                                <span className="material-icons-outlined text-yellow-400">emoji_events</span> Achievements
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-start">
                                    <div className="p-2 bg-surface-darker border border-white/10 rounded-lg text-yellow-500">
                                        <span className="material-icons-outlined text-xl">military_tech</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-medium">Coach of the Split</h4>
                                        <p className="text-gray-500 text-xs mt-0.5">LCS Summer 2024</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="p-2 bg-surface-darker border border-white/10 rounded-lg text-blue-400">
                                        <span className="material-icons-outlined text-xl">psychology</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-medium">Draft Master</h4>
                                        <p className="text-gray-500 text-xs mt-0.5">Highest draft advantage %</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="p-2 bg-surface-darker border border-white/10 rounded-lg text-primary">
                                        <span className="material-icons-outlined text-xl">trending_up</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-medium">Playoff Streak</h4>
                                        <p className="text-gray-500 text-xs mt-0.5">5 Consecutive Appearances</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-6 flex flex-col gap-6">
                        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6 z-10 relative">
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <span className="material-icons-outlined text-purple-400">radar</span> Coaching Style Matrix
                                </h3>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-mono text-gray-500 border border-white/10 px-2 py-1 rounded bg-black/20">SEASON 14</span>
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
                                    <path className="radar-poly" d="M200 60 L290 150 L200 200 L120 150 Z" fill="rgba(210, 249, 111, 0.15)" filter="drop-shadow(0 0 4px rgba(210, 249, 111, 0.4))" stroke="#D2F96F" strokeWidth="2"></path>
                                    <circle cx="200" cy="60" fill="#D2F96F" r="3"></circle>
                                    <circle cx="290" cy="150" fill="#D2F96F" r="3"></circle>
                                    <circle cx="200" cy="200" fill="#D2F96F" r="3"></circle>
                                    <circle cx="120" cy="150" fill="#D2F96F" r="3"></circle>
                                    <text fill="#E0E0E0" fontSize="10" fontWeight="bold" textAnchor="middle" x="200" y="35">MACRO STRATEGY</text>
                                    <text fill="#E0E0E0" fontSize="10" fontWeight="bold" textAnchor="middle" x="200" y="270">MICRO MGMT</text>
                                    <text fill="#E0E0E0" fontSize="10" fontWeight="bold" textAnchor="start" x="310" y="153">DRAFT PRECISION</text>
                                    <text fill="#E0E0E0" fontSize="10" fontWeight="bold" textAnchor="end" x="90" y="153">ADAPTABILITY</text>
                                    <foreignObject height="20" width="40" x="210" y="55">
                                        <div className="text-[9px] text-primary font-mono bg-black/80 px-1 rounded" xmlns="http://www.w3.org/1999/xhtml">94</div>
                                    </foreignObject>
                                </svg>
                            </div>
                        </div>
                        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg flex-1">
                            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-gray-400">history</span> Strategic History
                            </h3>
                            <div className="relative pl-4 timeline-line space-y-8">
                                <div className="relative pl-8">
                                    <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-primary rounded-full shadow-neon transform -translate-x-1/2"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-mono text-primary mb-1 block">OCT 2024</span>
                                            <h4 className="text-white text-sm font-bold">World Championship Quarterfinals</h4>
                                            <p className="text-gray-400 text-xs mt-1">Led Cloud9 to first int'l knockout stage in 3 years.</p>
                                        </div>
                                        <span className="bg-surface-darker text-gray-400 text-[10px] px-2 py-1 rounded border border-white/5">Details</span>
                                    </div>
                                </div>
                                <div className="relative pl-8">
                                    <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-surface-darker border border-gray-500 rounded-full transform -translate-x-1/2"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-mono text-gray-500 mb-1 block">AUG 2024</span>
                                            <h4 className="text-gray-300 text-sm font-medium">LCS Summer Split Victory</h4>
                                            <p className="text-gray-500 text-xs mt-1">Secured #1 seed with a dominant 15-3 record.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative pl-8">
                                    <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-surface-darker border border-gray-500 rounded-full transform -translate-x-1/2"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-mono text-gray-500 mb-1 block">JAN 2024</span>
                                            <h4 className="text-gray-300 text-sm font-medium">Roster Rebuild</h4>
                                            <p className="text-gray-500 text-xs mt-1">Integrated 3 rookie players into starting lineup.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg">
                            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-gray-400">groups</span> Active Team
                            </h3>
                            <div className="bg-gradient-to-br from-[#00A9E0]/20 to-surface-darker p-5 rounded-xl border border-[#00A9E0]/30 mb-4 flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Cloud9_logo.svg/1200px-Cloud9_logo.svg.png')] bg-center bg-no-repeat bg-contain opacity-5 transform scale-150 group-hover:rotate-12 transition duration-700"></div>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(0,169,224,0.3)] z-10">
                                    <span className="text-[#00A9E0] font-black text-xl">C9</span>
                                </div>
                                <h4 className="text-white font-bold text-lg z-10">Cloud9</h4>
                                <p className="text-[#00A9E0] text-xs font-medium mb-4 z-10">LCS • North America</p>
                                <div className="grid grid-cols-2 gap-2 w-full z-10">
                                    <div className="bg-black/40 rounded p-2">
                                        <span className="text-[10px] text-gray-400 block uppercase">Rank</span>
                                        <span className="text-white font-mono text-sm">#1</span>
                                    </div>
                                    <div className="bg-black/40 rounded p-2">
                                        <span className="text-[10px] text-gray-400 block uppercase">Record</span>
                                        <span className="text-white font-mono text-sm">14-2</span>
                                    </div>
                                </div>
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
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">UPDATED 2M AGO</span>
                            </div>
                            <div className="space-y-3 flex-1">
                                <div className="bg-surface-darker border border-border-lime p-3 rounded-xl relative">
                                    <span className="absolute top-3 left-0 w-1 h-8 bg-primary rounded-r"></span>
                                    <p className="text-gray-300 text-xs leading-relaxed pl-2">
                                        Review <span className="text-white font-bold">Berserker's</span> positioning in late-game teamfights. Data suggests he is overextending by 15% compared to league average.
                                    </p>
                                </div>
                                <div className="bg-surface-darker border border-white/5 p-3 rounded-xl hover:border-white/20 transition">
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        <span className="text-gray-300 font-bold">Reminder:</span> Scrim scheduled with T1 at 14:00. Focus on Baron control setups.
                                    </p>
                                </div>
                                <div className="bg-surface-darker border border-white/5 p-3 rounded-xl hover:border-white/20 transition opacity-60">
                                    <p className="text-gray-500 text-xs leading-relaxed line-through">
                                        Analyze patch 14.4 item changes for mid lane mage meta.
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
