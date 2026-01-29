import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import OnboardingLayout from './OnboardingLayout';

const CalibrateAI: React.FC = () => {
  const navigate = useNavigate();
  const {
    aiConfig,
    setAIConfig,
    completeOnboarding,
    isSaving,
    teamName,
    gameTitle
  } = useOnboarding();

  const [isCalibrating, setIsCalibrating] = useState(false);

  const handleSliderChange = (name: keyof typeof aiConfig, value: number) => {
    setAIConfig({ [name]: value });
  };

  const handleToggleChange = (name: 'earlyGamePathing' | 'objectiveControl') => {
    setAIConfig({ [name]: !aiConfig[name] });
  };

  const handleConfirm = async () => {
    setIsCalibrating(true);

    // Simulate AI calibration
    await new Promise(resolve => setTimeout(resolve, 2000));

    const success = await completeOnboarding();

    if (!success) {
      setIsCalibrating(false);
      console.error('Failed to complete onboarding');
    }
  };

  const handleBack = () => {
    navigate('/onboarding/step-2');
  };

  const sliders = [
    {
      name: 'aggression' as const,
      label: 'Aggression Level',
      description: 'Team fight initiation tendency',
      icon: 'local_fire_department',
      lowLabel: 'Passive',
      highLabel: 'Aggressive',
    },
    {
      name: 'resourcePriority' as const,
      label: 'Resource Priority',
      description: 'Gold & XP distribution focus',
      icon: 'payments',
      lowLabel: 'Spread',
      highLabel: 'Funneled',
    },
    {
      name: 'visionInvestment' as const,
      label: 'Vision Investment',
      description: 'Ward placement priority',
      icon: 'visibility',
      lowLabel: 'Minimal',
      highLabel: 'Heavy',
    },
  ];

  const toggles = [
    {
      name: 'earlyGamePathing' as const,
      label: 'Early Game Focus',
      description: 'Prioritize early advantages',
      icon: 'speed',
    },
    {
      name: 'objectiveControl' as const,
      label: 'Objective Control',
      description: 'Dragons, Baron, Rift Herald priority',
      icon: 'emoji_events',
    },
  ];

  return (
    <OnboardingLayout currentStep={3}>
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Calibrate <span className="text-primary">Strategy Engine</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto font-light">
          Gemini calibrates using historical GRID match data and team tendencies.
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
        {/* Sliders */}
        <div className="space-y-6 mb-8">
          {sliders.map(slider => (
            <div
              key={slider.name}
              className="bg-surface-darker/80 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-surface-dark flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{slider.icon}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{slider.label}</h3>
                  <p className="text-[10px] text-gray-500">{slider.description}</p>
                </div>
                <div className="ml-auto text-lg font-bold text-primary font-mono">
                  {aiConfig[slider.name]}%
                </div>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiConfig[slider.name]}
                  onChange={(e) => handleSliderChange(slider.name, parseInt(e.target.value))}
                  className="w-full h-2 bg-surface-dark rounded-full appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, #D2F96F ${aiConfig[slider.name]}%, #1A1C14 ${aiConfig[slider.name]}%)`
                  }}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-gray-600">{slider.lowLabel}</span>
                  <span className="text-[10px] text-gray-600">{slider.highLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {toggles.map(toggle => (
            <button
              key={toggle.name}
              onClick={() => handleToggleChange(toggle.name)}
              className={`p-5 rounded-xl border text-left transition-all ${aiConfig[toggle.name]
                ? 'bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(210,249,111,0.1)]'
                : 'bg-surface-darker/80 border-white/10 hover:border-white/20'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${aiConfig[toggle.name] ? 'bg-primary text-black' : 'bg-surface-dark text-gray-500'
                  }`}>
                  <span className="material-symbols-outlined">{toggle.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-bold mb-1 ${aiConfig[toggle.name] ? 'text-white' : 'text-gray-300'}`}>
                    {toggle.label}
                  </h3>
                  <p className="text-[10px] text-gray-500">{toggle.description}</p>
                </div>
                <div className={`w-12 h-6 rounded-full p-0.5 transition-all ${aiConfig[toggle.name] ? 'bg-primary' : 'bg-surface-dark'
                  }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${aiConfig[toggle.name] ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleBack}
            className="px-6 py-4 rounded-lg font-medium border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all flex items-center gap-2"
            disabled={isCalibrating || isSaving}
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>

          <button
            onClick={handleConfirm}
            disabled={isCalibrating || isSaving}
            className={`px-10 py-4 rounded-lg font-bold text-lg transition-all flex items-center gap-3 ${isCalibrating || isSaving
              ? 'bg-surface-dark text-gray-500 cursor-wait border border-white/10'
              : 'bg-primary text-black hover:bg-primary-dark shadow-[0_0_30px_rgba(210,249,111,0.4)]'
              }`}
          >
            {isCalibrating || isSaving ? (
              <>
                <span className="material-icons animate-spin">sync</span>
                <span>Calibrating Gemini...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">auto_awesome</span>
                <span>Launch MetaCoach</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Badge */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded border border-purple-500/30 bg-surface-darker/50 backdrop-blur-md">
          <span className="material-symbols-outlined text-purple-400 text-sm">auto_awesome</span>
          <span className="text-[10px] uppercase tracking-widest text-purple-400">
            Powered by Gemini 2.5 Pro
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default CalibrateAI;