import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
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
    titleId: '6', // GRID Title ID for Valorant
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
  const setGameAndTeam = useOnboardingStore((state) => state.setGameAndTeam);

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Filter teams based on search query
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

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
              className={`group relative bg-surface-darker/80 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${selectedGame === game.id
                ? 'border-primary shadow-[0_0_30px_rgba(210,249,111,0.15)]'
                : `border-white/10 ${game.hoverBorder} ${game.hoverShadow}`
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="p-6 flex items-center gap-4">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${game.gradient} border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500`}>
                  <div className="absolute inset-0 grid-bg opacity-30"></div>
                  <span className={`text-lg font-bold ${game.textColor} z-10`}>
                    {game.id === 'lol' ? 'LoL' : 'VAL'}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
                  <p className="text-xs text-gray-500">{game.description}</p>
                </div>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedGame === game.id
                  ? 'border-primary bg-primary'
                  : 'border-white/20'
                  }`}>
                  {selectedGame === game.id && (
                    <span className="material-icons text-black text-sm">check</span>
                  )}
                </div>
              </div>

              <div className="px-6 pb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">GRID Data Source Active</span>
              </div>
            </div>
          ))}
        </div>

        {/* Team Selection Panel */}
        {selectedGame && (
          <div className="bg-surface-darker/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Select Your Team <span className="text-gray-500 font-normal text-sm ml-2">(from GRID Global Database)</span></h3>
                <p className="text-xs text-gray-500">This scopes all match history and analytics to your selected team.</p>
              </div>
              {teams.length > 0 && (
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">search</span>
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-surface-dark border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all w-full sm:w-64"
                  />
                  {teamSearchQuery && (
                    <button
                      onClick={() => setTeamSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  )}
                </div>
              )}
            </div>

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
            ) : filteredTeams.length === 0 && teamSearchQuery ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-icons text-gray-600 text-3xl mb-2">search_off</span>
                <p className="text-gray-500 text-sm">No teams found matching "{teamSearchQuery}"</p>
                <button
                  onClick={() => setTeamSearchQuery('')}
                  className="mt-4 px-4 py-2 text-xs border border-white/20 rounded-lg text-gray-300 hover:text-white hover:border-primary transition"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredTeams.map((team: any) => {
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