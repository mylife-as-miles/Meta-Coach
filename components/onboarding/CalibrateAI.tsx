import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';

const CalibrateAI: React.FC = () => {
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState({
    aggression: 85,
    resourcePriority: 30, // 0 = Top, 100 = Bot? HTML says "Bot Lane Focus" for 30? Wait.
    // HTML Slider: value="30". Left text: Bot Lane, Right text: Top Lane.
    // Usually Left is Min (0), Right is Max (100).
    // So 0 = Bot Lane, 100 = Top Lane? Or vice versa?
    // HTML: "Bot Lane Focus" text is displayed. Value is 30.
    // I'll assume 0 = Bot, 100 = Top based on labels "Bot Lane" (left) "Top Lane" (right).
    // But "Bot Lane Focus" implies it is focused on Bot.
    // If 0 is Bot, then 30 is heavily Bot.
    visionInvestment: 50,
    earlyGamePathing: true,
    objectiveControl: true
  });

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStrategy(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const handleToggleChange = (name: string) => {
    setStrategy(prev => ({ ...prev, [name as keyof typeof prev]: !prev[name as keyof typeof prev] }));
  };

  const handleConfirm = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const team = await db.teams.where('userId').equals(parseInt(userId)).first();
      if (team) {
        await db.teams.update(team.id, { strategy });
      } else {
        // Fallback create if missing (unlikely)
        await db.teams.add({
          userId: parseInt(userId),
          gameTitle: 'League of Legends', // Default
          roster: [],
          strategy
        });
      }

      await db.users.update(parseInt(userId), { onboardingComplete: true });
      navigate('/dashboard');

    } catch (error) {
      console.error("Failed to save strategy", error);
    }
  };

  // Derived values for UI
  const aggressionLabel = strategy.aggression > 70 ? 'HIGH' : strategy.aggression > 30 ? 'BALANCED' : 'LOW';
  const aggressionRisk = strategy.aggression > 70 ? 'Risk Heavy' : strategy.aggression > 30 ? 'Calculated' : 'Safe';

  // Resource Priority: 0 = Bot, 100 = Top (based on visual placement of text)
  const resourceFocus = strategy.resourcePriority < 40 ? 'Bot Lane Focus' : strategy.resourcePriority > 60 ? 'Top Lane Focus' : 'Balanced';

  const visionLabel = strategy.visionInvestment > 60 ? 'CONTROL HEAVY' : strategy.visionInvestment > 40 ? 'BALANCED' : 'ECONOMIC';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-black font-sans">
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

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
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Team Onboarding</span>
              <span className="text-sm font-bold text-white">Step 3 of 3</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center text-xs font-bold text-primary">
              AI
            </div>
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

            {/* Progress Line 2-3 Done */}
            <div className="absolute top-4 left-[50%] w-[33%] h-0.5 bg-primary -z-0"></div>

            <div className="flex flex-col items-center gap-3 relative z-10 w-1/3">
              <div className="w-8 h-8 rounded bg-primary text-black flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(210,249,111,0.5)] ring-4 ring-background-dark">
                3
              </div>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold bg-background-dark px-2">Calibrate AI</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 h-full">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary">System Calibration</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Finalizing Strategy Engine</h1>
                <p className="text-gray-400 mt-2 max-w-2xl text-sm md:text-base font-light">
                  Configure the Gemini AI parameters to align with your team's playstyle. These settings will dictate real-time analytic suggestions during matches.
                </p>
              </div>
            </div>
            <div className="w-full h-1 bg-surface-darker rounded-full overflow-hidden relative border border-white/5">
              <div className="absolute top-0 left-0 h-full bg-primary w-full shadow-[0_0_15px_rgba(210,249,111,0.5)]"></div>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              <span>Start</span>
              <span className="text-primary">100% Calibrated</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-grow">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-surface-darker/60 backdrop-blur-md border border-white/10 rounded-xl p-6 relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">tune</span>
                  Playstyle Parameters
                </h2>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Aggression Index</span>
                      <span className="text-primary font-mono text-xs">{aggressionLabel} ({strategy.aggression}%)</span>
                    </div>
                    <input
                      name="aggression"
                      className="w-full h-1.5 bg-surface-light/10 rounded-lg appearance-none cursor-pointer range-slider-thumb accent-primary focus:outline-none"
                      max="100" min="0"
                      type="range"
                      value={strategy.aggression}
                      onChange={handleSliderChange}
                    />
                    <div className="flex justify-between text-[10px] text-gray-600 uppercase tracking-wider font-mono">
                      <span>Calculated</span>
                      <span>{aggressionRisk}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Resource Priority</span>
                      <span className="text-primary font-mono text-xs">{resourceFocus}</span>
                    </div>
                    <input
                      name="resourcePriority"
                      className="w-full h-1.5 bg-surface-light/10 rounded-lg appearance-none cursor-pointer range-slider-thumb accent-primary focus:outline-none"
                      max="100" min="0"
                      type="range"
                      value={strategy.resourcePriority}
                      onChange={handleSliderChange}
                    />
                    <div className="flex justify-between text-[10px] text-gray-600 uppercase tracking-wider font-mono">
                      <span>Bot Lane</span>
                      <span>Top Lane</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Vision Investment</span>
                      <span className="text-primary font-mono text-xs">{visionLabel} ({strategy.visionInvestment}%)</span>
                    </div>
                    <input
                      name="visionInvestment"
                      className="w-full h-1.5 bg-surface-light/10 rounded-lg appearance-none cursor-pointer range-slider-thumb accent-primary focus:outline-none"
                      max="100" min="0"
                      type="range"
                      value={strategy.visionInvestment}
                      onChange={handleSliderChange}
                    />
                    <div className="flex justify-between text-[10px] text-gray-600 uppercase tracking-wider font-mono">
                      <span>Economic</span>
                      <span>Map Control</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`bg-surface-darker/60 backdrop-blur-md border ${strategy.earlyGamePathing ? 'border-primary/30' : 'border-white/10'} rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer`}
                  onClick={() => handleToggleChange('earlyGamePathing')}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-white/5 rounded text-primary">
                      <span className="material-symbols-outlined text-xl">timeline</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                      <input
                        checked={strategy.earlyGamePathing}
                        readOnly
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1">Early Game Pathing</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Prioritize level 1-3 jungler routing analysis.</p>
                </div>
                <div
                  className={`bg-surface-darker/60 backdrop-blur-md border ${strategy.objectiveControl ? 'border-primary/30' : 'border-white/10'} rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer`}
                  onClick={() => handleToggleChange('objectiveControl')}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-white/5 rounded text-primary">
                      <span className="material-symbols-outlined text-xl">flag</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                      <input
                        checked={strategy.objectiveControl}
                        readOnly
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1">Objective Control Macro</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Focus alerts on dragon/baron spawn timers.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col h-full">
              <div className="bg-[#11130e] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full relative">
                <div className="bg-white/5 border-b border-white/5 p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-primary text-sm animate-pulse">auto_awesome</span>
                    <span className="text-xs font-bold text-white tracking-wide">GEMINI PREVIEW</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                </div>
                <div className="p-5 flex-grow font-mono text-xs leading-relaxed text-gray-400 custom-scrollbar overflow-y-auto relative">
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none animate-scan z-0"></div>
                  <div className="relative z-10 space-y-4">
                    <p className="text-primary">&gt; Initializing simulation sequence...</p>
                    <p>&gt; Reading inputs: <span className="text-white">Aggression: {strategy.aggression}</span> | <span className="text-white">Focus: {resourceFocus.replace(/ /g, '_')}</span></p>
                    <div className="py-2 border-y border-white/5 my-3">
                      <p className="mb-2 text-gray-500 uppercase tracking-wider">Projected Strategy Analysis:</p>
                      <p className="text-white">
                        Based on {aggressionLabel.toLowerCase()} aggression parameters, the engine recommends a <span className="text-primary font-bold">{strategy.aggression > 60 ? 'Dive Heavy' : strategy.aggression < 40 ? 'Scaling' : 'Standard'}</span> composition.
                        Expect to {strategy.aggression > 60 ? 'prioritize early game skirmishes over scaling' : 'play for late game spikes'}.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Early Game Pressure</span>
                        <span className="text-white">{Math.min(100, strategy.aggression + 10)}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, strategy.aggression + 10)}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Scaling Potential</span>
                        <span className="text-white">{100 - Math.min(100, strategy.aggression)}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-white/40" style={{ width: `${100 - Math.min(100, strategy.aggression)}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-surface-dark p-3 rounded border border-white/5 mt-4">
                      <p className="text-primary mb-1">! Recommendation</p>
                      <p className="text-[10px] text-gray-400">
                        {strategy.aggression > 60
                          ? "Consider banning anti-dive champions (e.g., Janna, Taric) to maximize early game pathing efficiency."
                          : "Focus on warding defensive choke points to survive early game pressure."}
                      </p>
                    </div>
                    <p>&gt; Model confidence: <span className="text-green-400">98.4%</span></p>
                    <p className="animate-pulse">_</p>
                  </div>
                </div>
                <div className="bg-black/40 p-2 text-[9px] text-gray-600 font-mono border-t border-white/5 flex justify-between">
                  <span>GEMINI-PRO-1.5</span>
                  <span>LATENCY: 12ms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 order-2 md:order-1">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-wider">System Operational</span>
                <span className="text-[10px] text-gray-500 font-mono">Ready for deployment</span>
              </div>
            </div>
            <div className="flex items-center gap-3 order-1 md:order-2 w-full md:w-auto">
              <button
                className="px-6 py-3 rounded-lg border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-colors w-full md:w-auto"
                onClick={() => navigate('/onboarding/step-2')}
              >
                Back
              </button>
              <button
                className="px-8 py-3 rounded-lg bg-primary hover:bg-primary-hover text-black text-sm font-bold shadow-[0_0_20px_rgba(210,249,111,0.3)] hover:shadow-[0_0_30px_rgba(210,249,111,0.5)] transition-all flex items-center justify-center gap-2 w-full md:w-auto group"
                onClick={handleConfirm}
              >
                <span>Confirm & Launch</span>
                <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">rocket_launch</span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 right-8 hidden xl:block text-[10px] text-gray-600 font-mono pointer-events-none">
          <div className="flex flex-col items-end gap-1">
            <span>LAT: 37.7749° N</span>
            <span>LNG: 122.4194° W</span>
            <span>SESSION: ID_9920A</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CalibrateAI;