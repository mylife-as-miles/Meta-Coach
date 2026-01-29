import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import OnboardingLayout from './OnboardingLayout';
import { supabase } from '../../lib/supabase';

const GAMES = [
  {
    id: 'lol',
    titleId: '3', // GRID Title ID for LoL
    name: 'League of Legends',
    description: 'Real-time match data, champion analytics, and macro strategy engine.',
    gradient: 'from-[#091428] to-[#0A323C]',
    accent: '#C8AA6E',
    textColor: 'text-[#C8AA6E]',
    hoverBorder: 'hover:border-primary/50',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(210,249,111,0.1)]',
  },
  {
    id: 'valorant',
    titleId: '29', // GRID Title ID for Valorant
    name: 'VALORANT',
    description: 'Round-by-round economy tracking, agent utility optimization, and aim analysis.',
    gradient: 'from-[#1F2326] to-[#363B40]',
    accent: '#FF4655',
    textColor: 'text-[#FF4655]',
    hoverBorder: 'hover:border-[#FF4655]',
    hoverShadow: 'hover:shadow-[0_0_30px_rgba(255,70,85,0.1)]',
  },
];

const ChooseGame: React.FC = () => {
  const navigate = useNavigate();
  const { setGameAndTeam } = useOnboarding();

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  // Fetch teams when a game is selected
  useEffect(() => {
    if (!selectedGame) {
      setTeams([]);
      return;
    }

    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      setTeamsError(null);
      setTeams([]);

      const game = GAMES.find(g => g.id === selectedGame);
      if (!game) return;

      try {
        const { data, error } = await supabase.functions.invoke('grid-teams', {
          body: { titleId: game.titleId }
        });

        if (error) {
          throw new Error(error.message || 'Failed to fetch teams');
        }

        if (data?.teams && Array.isArray(data.teams)) {
          setTeams(data.teams);
        } else {
          setTeams([]);
        }
      } catch (err: any) {
        console.error('Error fetching teams:', err);
        setTeamsError(err.message || 'Could not load teams. Please try again.');
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [selectedGame]);

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
    setSelectedTeam(null);
  };

  const handleTeamSelect = (team: { id: string; name: string }) => {
    setSelectedTeam(team);
  };

  const handleContinue = async () => {
    if (!selectedGame || !selectedTeam) return;

    setIsConnecting(true);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const game = GAMES.find(g => g.id === selectedGame);
    if (game) {
      setGameAndTeam(game.titleId, selectedTeam.id, selectedTeam.name, game.name);
    }

    navigate('/onboarding/step-2');
  };

  return (
    <OnboardingLayout currentStep={1}>
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Select <span className="text-primary">Battlespace</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto font-light">
          Choose your title and team to initialize the GRID intelligence stream.
        </p>
      </div>

      <div className="w-full max-w-5xl">
        {/* Game Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {GAMES.map((game) => (
            <div
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              className={`group relative border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer p-6 flex items-center justify-between ${selectedGame === game.id
                ? 'bg-surface-dark border-primary shadow-[0_0_20px_rgba(210,249,111,0.2)]'
                : 'bg-surface-dark/50 border-white/5 hover:border-white/20'
                }`}
            >
              <div className="flex items-center gap-6">
                {/* Game Logo/Icon */}
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold bg-surface-darker border border-white/10 ${game.textColor}`}>
                  {game.id === 'lol' ? 'LoL' : 'VAL'}
                </div>

                {/* Game Details */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
                  <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed">{game.description}</p>
                </div>
              </div>

              {/* Selection State / Status */}
              <div className="flex flex-col items-end gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${selectedGame === game.id
                    ? 'bg-primary border-primary text-black'
                    : 'border-white/10 text-transparent'
                  }`}>
                  <span className="material-icons text-lg font-bold">check</span>
                </div>
              </div>

              {/* Active Indicator (Absolute) */}
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedGame === game.id ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></span>
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">GRID Data Source Active</span>
              </div>
            </div>
          ))}
        </div>

        {/* Team Selection Panel */}
        {selectedGame && (
          <div className="bg-surface-darker/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2">Select Your Team <span className="text-gray-500 font-normal text-sm ml-2">(from GRID Global Database)</span></h3>
            <p className="text-xs text-gray-500 mb-6">This scopes all match history and analytics to your selected team.</p>

            {isLoadingTeams ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-icons animate-spin text-primary text-3xl">hourglass_top</span>
                <span className="ml-3 text-gray-400">Loading teams from GRID...</span>
              </div>
            ) : teamsError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-icons text-red-400 text-3xl mb-2">error_outline</span>
                <p className="text-red-400 text-sm">{teamsError}</p>
                <button
                  onClick={() => handleGameSelect(selectedGame)}
                  className="mt-4 px-4 py-2 text-xs border border-white/20 rounded-lg text-gray-300 hover:text-white hover:border-primary transition"
                >
                  Retry
                </button>
              </div>
            ) : teams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-icons text-gray-600 text-3xl mb-2">groups_off</span>
                <p className="text-gray-500 text-sm">No teams found in GRID database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {teams.map((team: any) => {
                  const isSelected = selectedTeam?.id === team.id;
                  const primaryColor = team.colorPrimary || '#D2F96F'; // Default to neon green

                  return (
                    <button
                      key={team.id}
                      onClick={() => handleTeamSelect(team)}
                      className={`p-4 rounded-lg border transition-all text-left flex flex-col items-center gap-3 relative overflow-hidden group ${isSelected
                        ? 'bg-white/5'
                        : 'bg-surface-dark border-white/10 hover:border-white/30 hover:bg-surface-darker'
                        }`}
                      style={{
                        borderColor: isSelected ? primaryColor : undefined,
                        boxShadow: isSelected ? `0 0 20px ${primaryColor}20` : undefined
                      }}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                      )}

                      {/* Logo or Placeholder */}
                      <div className="w-12 h-12 relative flex items-center justify-center">
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="w-full h-full object-contain drop-shadow-lg transition-transform group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}

                        {/* Fallback Initial (shown if no logo or on error) */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border border-white/10 ${!team.logoUrl ? '' : 'hidden'}`}
                          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                      </div>

                      <div className="text-center w-full">
                        <span className={`font-bold block truncate text-sm ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                          {team.name}
                        </span>
                        {/* Decorative Team Color Bar */}
                        <div className="h-0.5 w-8 mx-auto mt-2 rounded-full opacity-50" style={{ backgroundColor: primaryColor }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedGame || !selectedTeam || isConnecting}
            className={`px-8 py-4 rounded-lg font-bold transition-all flex items-center gap-3 ${selectedGame && selectedTeam && !isConnecting
              ? 'bg-primary text-black hover:bg-primary-dark shadow-[0_0_20px_rgba(210,249,111,0.3)]'
              : 'bg-surface-dark text-gray-500 cursor-not-allowed border border-white/10'
              }`}
          >
            {isConnecting ? (
              <>
                <span className="material-icons animate-spin text-sm">hourglass_top</span>
                Connecting to GRID...
              </>
            ) : (
              <>
                Continue to Roster
                <span className="material-icons text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded border border-white/5 bg-surface-darker/50 backdrop-blur-md">
          <span className="material-symbols-outlined text-gray-500 text-sm">dns</span>
          <span className="text-[10px] uppercase tracking-widest text-gray-500">
            {selectedTeam
              ? `Connected: ${selectedTeam.name}`
              : 'Connecting to GRID Server Node: US-WEST-1'
            }
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default ChooseGame;