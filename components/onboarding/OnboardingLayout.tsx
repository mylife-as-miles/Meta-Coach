import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';

interface OnboardingLayoutProps {
    children: ReactNode;
    currentStep: 1 | 2 | 3;
    stepLabels?: [string, string, string];
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
    children,
    currentStep,
    stepLabels = ['Team', 'Roster', 'Analytics']
}) => {
    return (
        <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary selection:text-black font-display">
            {/* Background Effects */}
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

            {/* Navigation */}
            <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
                <nav className="w-full max-w-7xl bg-surface-dark/50 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex justify-between items-center shadow-lg transition-all hover:bg-surface-dark/80">
                    <Link to="/" className="hover:opacity-80 transition-opacity">
                        <Logo />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-surface-dark border border-white/10 rounded-full text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span>System Online</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center relative z-10 min-h-screen pt-24 pb-12 px-6">
                {/* Progress Stepper */}
                <div className="w-full max-w-4xl mb-16 relative">
                    <div className="absolute top-4 left-0 w-full h-0.5 bg-surface-darker border-t border-white/10 -z-10"></div>

                    <div className="flex justify-between w-full relative">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className={`flex flex-col items-center gap-3 relative z-10 w-1/3 ${step > currentStep ? 'opacity-50' : ''}`}>
                                <div
                                    className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ring-4 ring-background-dark ${step <= currentStep
                                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(210,249,111,0.5)]'
                                        : 'bg-surface-dark border border-white/20 text-gray-500'
                                        }`}
                                >
                                    {step < currentStep ? (
                                        <span className="material-icons text-sm">check</span>
                                    ) : (
                                        step
                                    )}
                                </div>
                                <span className={`text-[10px] uppercase tracking-widest font-bold bg-background-dark px-2 ${step <= currentStep ? 'text-primary' : 'text-gray-500'
                                    }`}>
                                    {stepLabels[step - 1]}
                                </span>
                            </div>
                        ))}

                        {/* Progress Lines */}
                        <div
                            className="absolute top-4 left-[16%] h-0.5 bg-primary -z-0 transition-all duration-500"
                            style={{ width: currentStep >= 2 ? '33%' : '0%' }}
                        ></div>
                        <div
                            className="absolute top-4 left-[50%] h-0.5 bg-primary -z-0 transition-all duration-500"
                            style={{ width: currentStep >= 3 ? '33%' : '0%' }}
                        ></div>
                    </div>
                </div>

                {/* Step Content */}
                {children}
            </main>

            {/* Corner Coordinates */}
            <div className="absolute bottom-8 right-8 hidden md:block text-[10px] text-gray-600 font-mono">
                <div className="flex flex-col items-end gap-1">
                    <span>LAT: 37.7749° N</span>
                    <span>LNG: 122.4194° W</span>
                </div>
            </div>
        </div>
    );
};

export default OnboardingLayout;
