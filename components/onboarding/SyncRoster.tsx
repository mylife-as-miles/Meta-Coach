import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
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
  imageUrl?: string | null;
}

const SyncRoster: React.FC = () => {
  const navigate = useNavigate();
  const roster = useOnboardingStore((state) => state.roster);
  const updateRosterPlayer = useOnboardingStore((state) => state.updateRosterPlayer);
  const teamName = useOnboardingStore((state) => state.teamName);
  const gameTitle = useOnboardingStore((state) => state.gameTitle);
  const gridTitleId = useOnboardingStore((state) => state.gridTitleId);
  const gridTeamId = useOnboardingStore((state) => state.gridTeamId);
  const setRoster = useOnboardingStore((state) => state.setRoster);

  const [activeRoles, setActiveRoles] = useState(LOL_ROLES);
  const [isLoading, setIsLoading] = useState(true);
  const [gridPlayers, setGridPlayers] = useState<GridPlayer[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
          body: { teamId: gridTeamId, titleId: gridTitleId, teamName: teamName }
        });

        if (error) throw error;

        console.log('GRID Players:', data.players);
        setGridPlayers(data.players || []);

        // Auto-fill roster if empty
        if (data.players && data.players.length > 0) {
          const newRoster = [...roster];

          data.players.forEach((p: GridPlayer, i: number) => {
            // If we have more players than slots, expand the roster
            if (i >= newRoster.length) {
              newRoster.push({
                role: 'Substitute',
                ign: p.nickname,
                imageUrl: p.imageUrl,
                gridId: p.id
              });
            } else if (!newRoster[i].ign) {
              // Fill existing empty slots
              newRoster[i].ign = p.nickname;
              newRoster[i].imageUrl = p.imageUrl;
              newRoster[i].gridId = p.id;
            }
          });

          setRoster(newRoster);

          // Also update active roles for UI mapping
          if (data.players.length > activeRoles.length) {
            const extraCount = data.players.length - activeRoles.length;
            const newRoles = [...activeRoles];
            for (let k = 0; k < extraCount; k++) {
              newRoles.push({
                name: 'Substitute',
                icon: 'group',
                description: 'Reserve Player'
              });
            }
            setActiveRoles(newRoles);
          }
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

  const handleNext = () => {
    // If on last slide, show custom confirmation modal
    if (activeIndex === activeRoles.length - 1) {
      setShowConfirmModal(true);
    } else {
      setActiveIndex(prev => prev + 1);
    }
  };


  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    } else {
      handleBack();
    }
  };

  const handleBack = () => navigate('/onboarding/step-1');
  const handleContinue = () => navigate('/onboarding/step-3');

  const filledCount = roster.filter(p => p.ign.trim() !== '').length;

  const currentRole = activeRoles[activeIndex];
  const currentPlayerMeta = gridPlayers[activeIndex];
  const isCurrentFilled = !!roster[activeIndex]?.ign;

  return (
    <OnboardingLayout currentStep={2}>
      <div className="text-center mb-6 space-y-2">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Official <span className="text-primary">Roster</span>
        </h1>

        {/* Team Badge */}
        {teamName && (
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-surface-darker/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg mt-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <span className="text-white font-bold tracking-wide text-sm">{teamName.toUpperCase()}</span>
            <span className="w-px h-3 bg-white/20"></span>
            <span className="text-primary font-mono text-xs tracking-wider">{gameTitle?.toUpperCase() || 'ESPORTS'}</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-5xl flex flex-col items-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 min-h-[400px]">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-400 animate-pulse text-sm font-mono">Syncing with GRID...</p>
          </div>
        ) : (
          <div className="flex flex-col w-full">

            {/* CAROUSEL AREA */}
            <div className="relative h-[500px] w-full bg-surface-dark/20 border border-white/5 rounded-3xl overflow-hidden flex shadow-2xl backdrop-blur-sm">

              {/* Background Role Letter - Artistic */}
              <div className="absolute left-[-20px] bottom-[-40px] text-[300px] font-black text-white/[0.03] select-none leading-none z-0">
                {currentRole.name[0]}
              </div>

              {/* Left Side: Info & Controls */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-20">

                {/* Role Tag */}
                <div className="inline-flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">{currentRole.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{currentRole.description}</span>
                    <span className="text-2xl text-white font-bold uppercase tracking-wide">{currentRole.name}</span>
                  </div>
                </div>

                {/* Input Field (Huge) */}
                <div className="mb-8 relative group">
                  <label className="text-[10px] text-primary mb-1 block mono uppercase">Player IGN</label>
                  <input
                    type="text"
                    value={roster[activeIndex]?.ign || ''}
                    onChange={(e) => handleInputChange(activeIndex, e.target.value)}
                    placeholder="Player..."
                    className="w-full bg-transparent text-5xl md:text-6xl font-black text-white placeholder:text-gray-700 focus:outline-none font-display tracking-tight uppercase"
                    autoFocus
                  />
                  {/* GRID Verified Badge (Inline) */}
                  {currentPlayerMeta && currentPlayerMeta.nickname === roster[activeIndex]?.ign && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-500/30">
                      <span className="material-icons text-[14px]">verified</span>
                      <span>VERIFIED ID: {currentPlayerMeta.id}</span>
                    </div>
                  )}
                  {/* Real Name */}
                  {currentPlayerMeta && (
                    <div className="text-sm text-gray-500 mt-1 pl-1">
                      {currentPlayerMeta.firstName} {currentPlayerMeta.lastName}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons (Desktop) */}
                <div className="hidden md:flex items-center gap-4 mt-auto">
                  <button
                    onClick={handlePrev}
                    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition text-white"
                  >
                    <span className="material-icons">arrow_back</span>
                  </button>
                  <div className="flex gap-2">
                    {activeRoles.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-8 bg-primary shadow-glow' : 'w-2 bg-gray-700'}`}
                      ></div>
                    ))}
                  </div>
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-primary-dark transition shadow-neon flex items-center gap-2"
                  >
                    <span>{activeIndex === activeRoles.length - 1 ? 'Finish' : 'Next'}</span>
                    <span className="material-icons text-sm">arrow_forward</span>
                  </button>
                </div>

              </div>

              {/* Right Side: Hero Image */}
              <div className="w-full md:w-1/2 relative h-full flex items-end justify-center z-10 overflow-visible">
                {/* Gradient backing */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-black/80 via-transparent to-transparent z-10"></div>

                {currentPlayerMeta?.imageUrl ? (
                  <div className="relative w-full h-full flex items-end justify-center">
                    <img
                      key={currentPlayerMeta.imageUrl} // Key change forces animation
                      src={currentPlayerMeta.imageUrl}
                      referrerPolicy="no-referrer"
                      alt={currentPlayerMeta.nickname}
                      className="h-[90%] md:h-[110%] object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-fade-in-up md:translate-x-10"
                    />
                    {/* Inner Shadow Gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent z-20"></div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10 select-none overflow-hidden">
                    {/* Unique Letter Avatar Design */}
                    <span className="text-[250px] md:text-[350px] font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent transform -skew-x-12 translate-x-10">
                      {roster[activeIndex]?.ign ? roster[activeIndex].ign.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Navigation (Bottom) */}
            <div className="md:hidden flex items-center justify-between mt-6 w-full px-2">
              <button
                onClick={handlePrev}
                className="p-3 rounded-full bg-surface-dark border border-white/10 text-white"
              >
                <span className="material-icons">arrow_back</span>
              </button>
              <div className="text-sm font-mono text-gray-400">
                {activeIndex + 1} / {activeRoles.length}
              </div>
              <button
                onClick={handleNext}
                className="p-3 rounded-full bg-primary text-black"
              >
                <span className="material-icons">arrow_forward</span>
              </button>
            </div>

            {/* Roster Overview Strip */}
            <div className="mt-8 overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex gap-2 min-w-max px-2 md:justify-center">
                {activeRoles.map((role, idx) => {
                  const filled = !!roster[idx]?.ign;
                  const isSelected = idx === activeIndex;
                  return (
                    <button
                      key={role.name}
                      onClick={() => setActiveIndex(idx)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-300 min-w-[100px] ${isSelected
                        ? 'bg-surface-dark border-primary/50 ring-1 ring-primary/50'
                        : 'bg-surface-dark/30 border-white/5 hover:border-white/20'
                        }`}
                    >
                      <span className={`text-[10px] bg-background-dark/50 px-1.5 rounded uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
                        {role.name}
                      </span>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden ${filled
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/10 bg-white/5'
                        }`}>
                        {gridPlayers[idx]?.imageUrl ? (
                          <img src={gridPlayers[idx].imageUrl!} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <span className={`material-symbols-outlined text-sm ${filled ? 'text-green-500' : 'text-gray-600'}`}>
                            {role.icon}
                          </span>
                        )}
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-transparent'}`}></div>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {/* CUSTOM CONFIRMATION POPUP */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
              onClick={() => setShowConfirmModal(false)}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[#0E100A] border border-primary/20 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(210,249,111,0.1)] outline outline-1 outline-white/5 animate-fade-in-up">
              <div className="flex flex-col items-center text-center">

                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="material-icons text-primary text-3xl">verified_user</span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Confirm Roster</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  You are about to lock in <span className="text-white font-bold">{filledCount} active players</span> for the upcoming season.
                  This will generate your specialized AI models.
                </p>

                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition font-medium"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleContinue}
                    className="flex-1 py-3.5 rounded-lg bg-primary text-black font-bold hover:bg-primary-dark transition shadow-neon flex items-center justify-center gap-2"
                  >
                    <span>Proceed</span>
                    <span className="material-icons text-sm">arrow_forward</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </OnboardingLayout>
  );
};

export default SyncRoster;