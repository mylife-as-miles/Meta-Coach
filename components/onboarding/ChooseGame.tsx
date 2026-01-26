import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';

const ChooseGame: React.FC = () => {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (gameTitle: 'League of Legends' | 'VALORANT') => {
    setConnecting(gameTitle);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/auth');
        return;
      }

      const existingTeam = await db.teams.where('userId').equals(parseInt(userId)).first();

      const defaultStrategy = {
        aggression: 50,
        resourcePriority: 50,
        visionInvestment: 50,
        earlyGamePathing: false,
        objectiveControl: false
      };

      if (existingTeam) {
        await db.teams.update(existingTeam.id, { gameTitle });
      } else {
        await db.teams.add({
          userId: parseInt(userId),
          gameTitle,
          roster: [],
          strategy: defaultStrategy
        });
      }

      navigate('/onboarding/step-2');

    } catch (error) {
      console.error("Failed to save game selection", error);
      setConnecting(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary selection:text-black font-display">
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Grid Coordinates - Hidden on mobile */}
      <div className="fixed top-0 left-12 w-px h-full bg-white/5 z-0 hidden lg:block">
        <div className="absolute top-32 -left-3 text-[9px] font-mono text-gray-600 dark:text-gray-500 bg-background-dark px-1">Y:1024</div>
      </div>
      <div className="fixed top-32 left-0 w-full h-px bg-white/5 z-0 hidden lg:block">
        <div className="absolute left-32 -top-3 text-[9px] font-mono text-gray-600 dark:text-gray-500 bg-background-dark px-1">X:0042</div>
      </div>

      <nav className="w-full z-50 fixed top-0 px-6 py-6 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-black font-bold text-lg shadow-[0_0_10px_rgba(210,249,111,0.4)]">
              <span className="material-icons text-sm">auto_graph</span>
            </div>
            <span className="text-xl font-bold tracking-tight">MetaCoach</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-surface-dark border border-white/10 rounded-full text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>System Online</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center relative z-10 min-h-screen pt-24 pb-12 px-6">
        <div className="w-full max-w-4xl mb-16 relative">
          {/* Progress Lines */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-surface-darker border-t border-white/10 -z-10"></div>

          <div className="flex justify-between w-full relative">
            <div className="flex flex-col items-center gap-3 relative z-10 w-1/3">
              <div className="w-8 h-8 rounded bg-primary text-black flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(210,249,111,0.5)] ring-4 ring-background-dark">
                1
              </div>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold bg-background-dark px-2">Choose Game</span>
            </div>

            {/* Progress Line Part 1 - Active */}
            <div className="absolute top-4 left-[16%] w-[33%] h-0.5 bg-primary -z-0"></div>

            <div className="flex flex-col items-center gap-3 relative z-10 w-1/3 opacity-50">
              <div className="w-8 h-8 rounded bg-surface-dark border border-white/20 text-gray-500 flex items-center justify-center font-bold text-sm ring-4 ring-background-dark">
                2
              </div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-background-dark px-2">Sync Roster</span>
            </div>

            <div className="flex flex-col items-center gap-3 relative z-10 w-1/3 opacity-50">
              <div className="w-8 h-8 rounded bg-surface-dark border border-white/20 text-gray-500 flex items-center justify-center font-bold text-sm ring-4 ring-background-dark">
                3
              </div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-background-dark px-2">Calibrate AI</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight">Select <span className="text-primary">Battlespace</span></h1>
          <p className="text-gray-400 max-w-lg mx-auto font-light">Choose your title to initialize the GRID data stream. Our AI will calibrate specifically for the game mechanics selected.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* League of Legends Card */}
          <div
            className="group relative bg-surface-darker/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-[0_0_30px_rgba(210,249,111,0.1)] transition-all duration-300 cursor-pointer"
            onClick={() => handleConnect('League of Legends')}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-primary/30 rounded-tl-xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-primary/30 rounded-br-xl"></div>

            <div className="p-8 flex flex-col items-center h-full">
              <div className="w-full h-40 mb-8 rounded-lg bg-gradient-to-br from-[#091428] to-[#0A323C] border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute inset-0 grid-bg opacity-30"></div>
                <div className="text-center z-10">
                  <span className="block text-3xl font-bold tracking-tighter text-[#C8AA6E] drop-shadow-lg font-serif italic">LEAGUE</span>
                  <span className="block text-xs tracking-[0.3em] text-[#F0E6D2] mt-1">OF LEGENDS</span>
                </div>
              </div>

              <div className="flex-grow w-full text-center">
                <h3 className="text-2xl font-bold text-white mb-2">League of Legends</h3>
                <p className="text-sm text-gray-500 mb-6">Real-time match data, champion analytics, and macro strategy engine.</p>
              </div>

              <div className="w-full mt-6 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">GRID Data Source Active</span>
                </div>
                <button
                  className={`w-full py-4 bg-surface-dark border border-white/10 hover:bg-primary hover:border-primary hover:text-black text-white font-bold rounded-lg transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden ${connecting === 'League of Legends' ? 'bg-primary text-black border-primary' : ''}`}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative z-10">
                    {connecting === 'League of Legends' ? 'Connecting...' : 'Connect Data Source'}
                  </span>
                  <span className="material-icons text-sm relative z-10">
                    {connecting === 'League of Legends' ? 'hourglass_top' : 'cable'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* VALORANT Card */}
          <div
            className="group relative bg-surface-darker/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-[#FF4655] hover:shadow-[0_0_30px_rgba(255,70,85,0.1)] transition-all duration-300 cursor-pointer"
            onClick={() => handleConnect('VALORANT')}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FF4655]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-[#FF4655]/30 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-[#FF4655]/30 rounded-bl-xl"></div>

            <div className="p-8 flex flex-col items-center h-full">
              <div className="w-full h-40 mb-8 rounded-lg bg-gradient-to-br from-[#1F2326] to-[#363B40] border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute inset-0 grid-bg opacity-30"></div>
                <div className="text-center z-10">
                  <span className="block text-4xl font-bold tracking-tighter text-[#FF4655] drop-shadow-md font-sans uppercase">Valorant</span>
                </div>
              </div>

              <div className="flex-grow w-full text-center">
                <h3 className="text-2xl font-bold text-white mb-2">VALORANT</h3>
                <p className="text-sm text-gray-500 mb-6">Round-by-round economy tracking, agent utility optimization, and aim analysis.</p>
              </div>

              <div className="w-full mt-6 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">GRID Data Source Active</span>
                </div>
                <button
                  className={`w-full py-4 bg-surface-dark border border-white/10 hover:bg-[#FF4655] hover:border-[#FF4655] hover:text-white text-white font-bold rounded-lg transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden ${connecting === 'VALORANT' ? 'bg-[#FF4655] text-white border-[#FF4655]' : ''}`}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative z-10">
                    {connecting === 'VALORANT' ? 'Connecting...' : 'Connect Data Source'}
                  </span>
                  <span className="material-icons text-sm relative z-10">
                    {connecting === 'VALORANT' ? 'hourglass_top' : 'cable'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded border border-white/5 bg-surface-darker/50 backdrop-blur-md">
            <span className="material-symbols-outlined text-gray-500 text-sm">dns</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Connecting to GRID Server Node: US-WEST-1</span>
          </div>
        </div>
      </main>

      <div className="absolute bottom-8 right-8 hidden md:block text-[10px] text-gray-600 font-mono">
        <div className="flex flex-col items-end gap-1">
          <span>LAT: 37.7749° N</span>
          <span>LNG: 122.4194° W</span>
        </div>
      </div>
    </div>
  );
};

export default ChooseGame;