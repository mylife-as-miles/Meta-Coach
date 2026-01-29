import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import OnboardingLayout from './OnboardingLayout';

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

const SyncRoster: React.FC = () => {
  const navigate = useNavigate();
  const { roster, updateRosterPlayer, teamName, gameTitle, gridTitleId, setRoster } = useOnboarding();
  const [activeRoles, setActiveRoles] = useState(LOL_ROLES);

  // Set active roles based on Title ID
  useEffect(() => {
    if (gridTitleId === '6') { // Valorant
      setActiveRoles(VALORANT_ROLES);
      if (roster[0].role === 'Top') { // Reset if still showing LoL defaults
        setRoster(VALORANT_ROLES.map(r => ({ role: r.name, ign: '' })));
      }
    } else { // Default to LoL (ID 3)
      setActiveRoles(LOL_ROLES);
      if (roster[0].role === 'Duelist') { // Reset if showing Val defaults
        setRoster(LOL_ROLES.map(r => ({ role: r.name, ign: '' })));
      }
    }
  }, [gridTitleId]);

  const handleInputChange = (index: number, value: string) => {
    updateRosterPlayer(index, value);
  };

  const handleContinue = () => {
    navigate('/onboarding/step-3');
  };

  // Create handleBack function
  const handleBack = () => {
    navigate('/onboarding/step-1');
  };

  const handleSkip = () => {
    navigate('/onboarding/step-3');
  };

  const filledCount = roster.filter(p => p.ign.trim() !== '').length;

  return (
    <OnboardingLayout currentStep={2}>
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Sync <span className="text-primary">Roster</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto font-light">
          Link player IGNs to enrich team-level insights with individual performance data.
        </p>
        {teamName && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-dark border border-primary/30 rounded-full text-xs">
            <span className="text-primary font-bold">{teamName}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">{gameTitle}</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl">
        {/* Roster Input Cards */}
        <div className="space-y-4 mb-8">
          {activeRoles.map((role, index) => (
            <div
              key={role.name}
              className={`group relative bg-surface-darker/80 backdrop-blur-sm border rounded-xl p-5 transition-all duration-300 ${roster[index]?.ign
                ? 'border-primary/30 shadow-[0_0_15px_rgba(210,249,111,0.05)]'
                : 'border-white/10 hover:border-white/20'
                }`}
            >
              <div className="flex items-center gap-4">
                {/* Role Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${roster[index]?.ign
                  ? 'bg-primary/20 text-primary'
                  : 'bg-surface-dark text-gray-500 group-hover:text-white'
                  }`}>
                  <span className="material-symbols-outlined">{role.icon}</span>
                </div>

                {/* Role Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{role.name}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{role.description}</span>
                  </div>
                  <input
                    type="text"
                    placeholder={`Enter ${role.name} player IGN...`}
                    value={roster[index]?.ign || ''}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    className="w-full bg-transparent text-gray-300 placeholder:text-gray-600 focus:outline-none focus:text-white text-sm font-mono"
                  />
                </div>

                {/* Status Indicator */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${roster[index]?.ign
                  ? 'border-primary bg-primary'
                  : 'border-white/20'
                  }`}>
                  {roster[index]?.ign && (
                    <span className="material-icons text-black text-sm">check</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-1 flex-1 bg-surface-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 shadow-neon"
              style={{ width: `${(filledCount / 5) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 font-mono">{filledCount}/5</span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-lg font-medium border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all flex items-center gap-2"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>

          <button
            onClick={handleSkip}
            className="px-6 py-3 rounded-lg font-medium border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all flex items-center gap-2"
          >
            Skip for Now
            <span className="material-icons text-sm">arrow_forward</span>
          </button>

          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-lg font-bold bg-primary text-black hover:bg-primary-dark shadow-[0_0_20px_rgba(210,249,111,0.3)] transition-all flex items-center gap-2"
          >
            Continue to Analytics
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded border border-white/5 bg-surface-darker/50 backdrop-blur-md">
          <span className="material-symbols-outlined text-gray-500 text-sm">info</span>
          <span className="text-[10px] uppercase tracking-widest text-gray-500">
            Player data enriches but doesn't replace GRID team insights
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default SyncRoster;