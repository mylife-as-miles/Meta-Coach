import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';

const SyncRoster: React.FC = () => {
  const navigate = useNavigate();
  const [roster, setRoster] = useState<string[]>(['', '', '', '', '']);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/auth');
        return;
      }
      const team = await db.teams.where('userId').equals(parseInt(userId)).first();
      if (team && team.roster && team.roster.length > 0) {
        // Pad or truncate to 5
        const loadedRoster = [...team.roster];
        while (loadedRoster.length < 5) loadedRoster.push('');
        setRoster(loadedRoster);
      }
    };
    loadTeam();
  }, [navigate]);

  const handleInputChange = (index: number, value: string) => {
    const newRoster = [...roster];
    newRoster[index] = value;
    setRoster(newRoster);
  };

  const handleNextStep = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // Filter out empty strings? Or keep them?
    // Ideally user should fill all, but for prototype we allow empty.

    try {
      const team = await db.teams.where('userId').equals(parseInt(userId)).first();
      if (team) {
        await db.teams.update(team.id, { roster });
        navigate('/onboarding/step-3');
      } else {
        // Should not happen if flow is followed, but safe to redirect to step 1
        navigate('/onboarding/step-1');
      }
    } catch (error) {
      console.error("Failed to save roster", error);
    }
  };

  const roles = [
    { id: 1, label: 'TOP / DUELIST', icon: 'check_circle', status: 'Data Synced', statusColor: 'text-primary' },
    { id: 2, label: 'JUNGLE / INITIATOR', icon: 'auto_awesome', status: 'Gemini Analyzing...', statusColor: 'text-primary' },
    { id: 3, label: 'MID / CONTROLLER', icon: 'hourglass_empty', status: 'Waiting for input', statusColor: 'text-gray-600' },
    { id: 4, label: 'BOT / CARRY', icon: 'hourglass_empty', status: 'Waiting for input', statusColor: 'text-gray-600' },
    { id: 5, label: 'SUP / SENTINEL', icon: 'hourglass_empty', status: 'Waiting for input', statusColor: 'text-gray-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-black font-sans">
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="fixed top-0 left-12 w-px h-full bg-white/5 z-0 hidden lg:block">
        <div className="absolute top-32 -left-3 text-[9px] font-mono text-gray-600 dark:text-gray-500 bg-background-dark px-1">Y:1024</div>
      </div>
      <div className="fixed top-32 left-0 w-full h-px bg-white/5 z-0 hidden lg:block">
        <div className="absolute left-32 -top-3 text-[9px] font-mono text-gray-600 dark:text-gray-500 bg-background-dark px-1">X:0042</div>
      </div>

      <nav className="w-full z-50 fixed top-0 px-6 py-6 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-black font-bold text-lg shadow-[0_0_10px_rgba(210,249,111,0.4)]">
              <span className="material-icons text-sm">auto_graph</span>
            </div>
            <span className="text-xl font-bold tracking-tight">MetaCoach</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Breadcrumbs removed */}
            <a className="text-sm font-bold text-gray-400 hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/')}>Exit Setup</a>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center relative z-10 min-h-screen px-6 pt-24 pb-12">
        <div className="w-full max-w-4xl mb-12 relative">
          {/* Progress Lines */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-surface-darker border-t border-white/10 -z-10"></div>

          <div className="flex justify-between w-full relative">
            <div className="flex flex-col items-center gap-3 relative z-10 w-1/3">
              <div className="w-8 h-8 rounded bg-primary text-black flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(210,249,111,0.5)] ring-4 ring-background-dark">
                1
              </div>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold bg-background-dark px-2">Choose Game</span>
            </div>

            {/* Progress Line 1-2 Done */}
            <div className="absolute top-4 left-[16%] w-[33%] h-0.5 bg-primary -z-0"></div>

            <div className="flex flex-col items-center gap-3 relative z-10 w-1/3">
              <div className="w-8 h-8 rounded bg-primary text-black flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(210,249,111,0.5)] ring-4 ring-background-dark">
                2
              </div>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold bg-background-dark px-2">Sync Roster</span>
            </div>

            {/* Progress Line 2-3 Active */}
            <div className="absolute top-4 left-[50%] w-[16%] h-0.5 bg-primary -z-0"></div>

            <div className="flex flex-col items-center gap-3 relative z-10 w-1/3 opacity-50">
              <div className="w-8 h-8 rounded bg-surface-dark border border-white/20 text-gray-500 flex items-center justify-center font-bold text-sm ring-4 ring-background-dark">
                3
              </div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-background-dark px-2">Calibrate AI</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col space-y-8 relative">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded border border-primary/20 bg-primary/5 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Gemini AI Engine v2.0 Online</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium leading-[0.95] tracking-tight">
              Sync <br />
              Your <span className="text-primary">Roster.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-lg leading-relaxed font-light border-l border-white/20 pl-6">
              Import your 5-man squad. Our AI will instantly begin scraping public match history to build a comprehensive strategic profile for each player.
            </p>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-4 text-xs text-gray-500 font-mono mb-2">
                <span>DATA STREAMS</span>
                <span className="flex-grow border-b border-white/5 border-dashed"></span>
                <span className="text-primary">ACTIVE</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Riot API</span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_5px_#D2F96F]"></span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>OP.GG Scraper</span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_5px_#D2F96F]"></span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Historical VODs</span>
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="w-full bg-surface-darker/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 relative shadow-2xl overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-primary/5 rounded-full blur-2xl"></div>

              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Active Roster</h2>
                  <p className="text-xs text-gray-500 mt-1">Manually enter IGNs or <button className="text-primary hover:underline">Import CSV</button></p>
                </div>
                <div className="text-[10px] font-mono text-gray-600 bg-surface-dark px-2 py-1 rounded border border-white/5">
                  REGION: NA-WEST
                </div>
              </div>

              <form className="space-y-4">
                {roles.map((role, index) => {
                  const isActive = roster[index] !== '';
                  return (
                    <div key={role.id} className={`group relative bg-surface-dark border ${isActive ? 'border-primary/30' : 'border-white/10'} rounded-lg p-3 hover:border-white/20 transition-all`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-[10px] font-bold text-gray-400">{String(role.id).padStart(2, '0')}</span>
                          <label className={`text-[10px] uppercase tracking-wider ${isActive ? 'text-primary' : 'text-gray-500'} font-bold`}>{role.label}</label>
                        </div>
                        <div className={`flex items-center gap-1.5 ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                          <span className={`material-symbols-outlined text-[14px] ${isActive ? '' : ''}`}>{isActive ? 'check_circle' : 'hourglass_empty'}</span>
                          <span className="text-[9px] font-mono uppercase tracking-wide">{isActive ? 'Data Synced' : 'Waiting for input'}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          className={`w-full bg-surface-darker/50 border ${isActive ? 'border-primary/20' : 'border-white/5'} rounded px-3 py-2 text-sm text-white placeholder-gray-700 focus:border-primary/50 focus:ring-0 outline-none transition-all font-mono`}
                          type="text"
                          value={roster[index]}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          placeholder="Enter Player IGN..."
                        />
                        {isActive && (
                          <div className="absolute right-3 top-2.5 flex gap-1">
                            <div className="h-1 w-1 bg-primary rounded-full"></div>
                            <div className="h-1 w-1 bg-primary rounded-full"></div>
                            <div className="h-1 w-1 bg-primary rounded-full"></div>
                          </div>
                        )}
                        {index === 1 && isActive && (
                          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary/50 animate-[scan_2s_linear_infinite]"></div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 flex gap-4">
                  <button className="flex-1 bg-transparent hover:bg-white/5 border border-primary/30 hover:border-primary text-primary font-bold py-3.5 rounded-lg transition-all flex justify-center items-center gap-2 text-sm uppercase tracking-wider" type="button">
                    <span className="material-icons text-sm">download</span>
                    <span>Fetch Data</span>
                  </button>
                  <button
                    className="flex-1 bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-lg transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 hover:shadow-[0_0_20px_rgba(210,249,111,0.3)] text-sm uppercase tracking-wider"
                    type="button"
                    onClick={handleNextStep}
                  >
                    <span>Next Step</span>
                    <span className="material-icons text-sm">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden md:block text-[10px] text-gray-600 font-mono">
          <div className="flex flex-col items-end gap-1">
            <span>LAT: 37.7749° N</span>
            <span>LNG: 122.4194° W</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SyncRoster;