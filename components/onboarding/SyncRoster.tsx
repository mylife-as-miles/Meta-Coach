import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import OnboardingLayout from './OnboardingLayout';
import { supabase } from '../../lib/supabase';

const LOL_ROLES = [
  { name: 'Top', icon: 'shield', description: 'Frontline & Split Push' },
  { name: 'Jungle', icon: 'forest', description: 'Map Control & Objectives' },
  { name: 'Mid', icon: 'bolt', description: 'Playmaking & Roaming' },
  { name: 'ADC', icon: 'gps_fixed', description: 'Damage & Positioning' },
  { name: 'Support', icon: 'favorite', description: 'Vision & Utility' },
];

const VALORANT_ROLES = [
  { name: 'Duelist', icon: 'swords', description: 'Entry & Aggression' },
  { name: 'Sentinel', icon: 'security', description: 'Defense & Flank Watch' },
  { name: 'Controller', icon: 'smoke_free', description: 'Vision Blocking & Control' },
  { name: 'Initiator', icon: 'radar', description: 'Info Gathering & Setups' },
  { name: 'Flex', icon: 'change_history', description: 'Adaptable Role' },
];

interface GridPlayer {
  id: string;
  nickname: string;
  firstName?: string;
  lastName?: string;
  externalLinks?: any[];
}

const SyncRoster: React.FC = () => {
  const navigate = useNavigate();
  const { roster, updateRosterPlayer, teamName, gameTitle, gridTitleId, gridTeamId, setRoster } = useOnboarding();
  const [activeRoles, setActiveRoles] = useState(LOL_ROLES);
  const [isLoading, setIsLoading] = useState(true);
  const [gridPlayers, setGridPlayers] = useState<GridPlayer[]>([]);

  // 1. Determine Roles based on Title
  useEffect(() => {
    if (gridTitleId === '6') { // Valorant
      setActiveRoles(VALORANT_ROLES);
    } else { // Default to LoL
      setActiveRoles(LOL_ROLES);
    }
  }, [gridTitleId]);

  // 2. Fetch Players from GRID Edge Function
  useEffect(() => {
    const fetchGridPlayers = async () => {
      if (!gridTeamId) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching players for team:', gridTeamId);
        const { data, error } = await supabase.functions.invoke('grid-players', {
          body: { teamId: gridTeamId }
        });

        if (error) throw error;

        console.log('GRID Players:', data.players);
        setGridPlayers(data.players || []);

        // Auto-fill roster if empty
        if (data.players && data.players.length > 0) {
          // Simple mapping logic: Fill slots sequentially for now
          // In a real scenario, we'd try to match role metadata if available
          const newRoster = [...roster];
          data.players.slice(0, 5).forEach((p: GridPlayer, i: number) => {
            // Only auto-fill if the slot is currently empty to avoid overwriting user input on re-render
            if (i < newRoster.length && !newRoster[i].ign) {
              newRoster[i].ign = p.nickname;
            }
          });
          setRoster(newRoster);
        }

      } catch (err) {
        console.error('Error fetching GRID players:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGridPlayers();
  }, [gridTeamId]);


  const handleInputChange = (index: number, value: string) => {
    updateRosterPlayer(index, value);
  };

  const handleBack = () => navigate('/onboarding/step-1');
  const handleContinue = () => navigate('/onboarding/step-3');
  const handleSkip = () => navigate('/onboarding/step-3');

  const filledCount = roster.filter(p => p.ign.trim() !== '').length;

  return (
    <OnboardingLayout currentStep={2}>
      <div className="text-center mb-10 space-y-4">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Official <span className="text-primary">Roster</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto font-light">
          Verify the active lineup fetched directly from the GRID Data Platform.
        </p>

        {/* Team Badge */}
        {teamName && (
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-surface-darker/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <span className="text-white font-bold tracking-wide">{teamName.toUpperCase()}</span>
            <span className="w-px h-3 bg-white/20"></span>
            <span className="text-primary font-mono text-xs">{gameTitle?.toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-400 animate-pulse text-sm font-mono">Syncing with GRID...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 mb-10">
            {activeRoles.map((role, index) => {
              // Find if there is specific GRID data for this slot (by index mapping for now)
              const playerMeta = gridPlayers[index];
              const isFilled = !!roster[index]?.ign;

              return (
                <div
                  key={role.name}
                  className={`group relative bg-surface-dark/40 backdrop-blur-md border rounded-xl overflow-hidden transition-all duration-300 hover:bg-surface-dark/60 ${isFilled
                      ? 'border-primary/20 shadow-[0_0_20px_rgba(210,249,111,0.02)]'
                      : 'border-white/5'
                    }`}
                >
                  {/* Background Role Icon (faded) */}
                  <div className="absolute -right-4 -bottom-4 text-[100px] text-white/[0.02] pointer-events-none select-none">
                    <span className="material-symbols-outlined">{role.icon}</span>
                  </div>

                  <div className="flex items-center p-4 gap-5">

                    {/* Role Indicator */}
                    <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center border transition-colors ${isFilled ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-dark border-white/5 text-gray-600'
                      }`}>
                      <span className="material-symbols-outlined text-2xl mb-1">{role.icon}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider">{role.name}</span>
                    </div>

                    {/* Player Input Area */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold pl-1">
                        {role.description}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={roster[index]?.ign || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          placeholder="Waiting for player..."
                          className="w-full bg-transparent text-xl font-bold text-white placeholder:text-gray-700 focus:outline-none font-display tracking-tight"
                        />
                        {/* GRID Verified Badge */}
                        {playerMeta && playerMeta.nickname === roster[index]?.ign && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">
                            <span className="material-icons text-[10px]">verified</span>
                            GRID ID: {playerMeta.id}
                          </div>
                        )}
                      </div>
                      {/* Real Name Subtext */}
                      {playerMeta && (
                        <div className="text-xs text-gray-500 pl-1">
                          {playerMeta.firstName} {playerMeta.lastName}
                        </div>
                      )}
                    </div>

                    {/* Status Check */}
                    <div>
                      <div className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${isFilled ? 'bg-primary text-black border-primary' : 'border-white/10 text-transparent'
                        }`}>
                        <span className="material-icons text-sm">check</span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Bar */}
        <div className="flex items-center gap-4 mb-8 max-w-md mx-auto">
          <span className="text-xs font-mono text-gray-500">ROSTER COMPLETE</span>
          <div className="h-1 flex-1 bg-surface-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_#D2F96F]"
              style={{ width: `${(filledCount / 5) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs font-mono text-primary">{filledCount}/5</span>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-xl font-medium border border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>

          <button
            onClick={handleContinue}
            // Enable button always, but style it differently if incomplete? No, let user force proceed if they want.
            className="group px-8 py-3 rounded-xl font-bold bg-primary text-black hover:bg-primary-dark shadow-[0_0_30px_rgba(210,249,111,0.2)] hover:shadow-[0_0_40px_rgba(210,249,111,0.4)] transition-all flex items-center gap-2"
          >
            <span>Confirm Roster</span>
            <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default SyncRoster;