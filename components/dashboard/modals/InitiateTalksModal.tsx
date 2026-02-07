import React, { useState, useEffect } from 'react';
import { useInitiateNegotiation, useUpdateNegotiation } from '../../../hooks/useDashboardQueries';

interface InitiateTalksModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    player: {
        id: string;
        name: string;
        role: string;
        team: string;
        avatarUrl?: string | null;
        askingPrice: number;
    };
}

type Phase = 'intro' | 'offer' | 'negotiating' | 'result';
type AgentMood = 'happy' | 'neutral' | 'frustrated' | 'angry';

const AGENT_AVATARS = [
    '👔', '🤵', '💼', '🕴️'
];

const AGENT_RESPONSES: Record<AgentMood, string[]> = {
    happy: [
        "That's a very reasonable offer. Let me discuss with my client.",
        "I think we can work with this. Looking good!",
        "My client is pleased with the direction of these talks.",
    ],
    neutral: [
        "I'll present this to my client and get back to you.",
        "Let me consult with the player on this offer.",
        "We're making progress, but there's still a gap.",
    ],
    frustrated: [
        "This offer is below what we expected. Can you do better?",
        "My client was hoping for something more substantial.",
        "We're quite far apart here. Let's be realistic.",
    ],
    angry: [
        "This is insulting! My client won't even consider this.",
        "We're wasting each other's time with these numbers.",
        "I'm advising my client to walk away from these talks.",
    ],
};

const InitiateTalksModal: React.FC<InitiateTalksModalProps> = ({
    isOpen,
    onClose,
    workspaceId,
    player,
}) => {
    const [phase, setPhase] = useState<Phase>('intro');
    const [offer, setOffer] = useState(Math.floor(player.askingPrice * 0.7));
    const [round, setRound] = useState(1);
    const [agentMood, setAgentMood] = useState<AgentMood>('neutral');
    const [agentMessage, setAgentMessage] = useState('');
    const [counterOffer, setCounterOffer] = useState(0);
    const [negotiationId, setNegotiationId] = useState<string | null>(null);
    const [result, setResult] = useState<'accepted' | 'rejected' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const initiateNegotiation = useInitiateNegotiation();
    const updateNegotiation = useUpdateNegotiation();

    const maxRounds = 5;
    const agentAvatar = AGENT_AVATARS[Math.floor(Math.random() * AGENT_AVATARS.length)];

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPhase('intro');
            setOffer(Math.floor(player.askingPrice * 0.7));
            setRound(1);
            setAgentMood('neutral');
            setAgentMessage('');
            setCounterOffer(0);
            setNegotiationId(null);
            setResult(null);
        }
    }, [isOpen, player.askingPrice]);

    // Auto-advance from intro after animation
    useEffect(() => {
        if (phase === 'intro' && isOpen) {
            const timer = setTimeout(() => setPhase('offer'), 2500);
            return () => clearTimeout(timer);
        }
    }, [phase, isOpen]);

    const calculateAgentMood = (offerAmount: number, asking: number): AgentMood => {
        const ratio = offerAmount / asking;
        if (ratio >= 0.95) return 'happy';
        if (ratio >= 0.8) return 'neutral';
        if (ratio >= 0.6) return 'frustrated';
        return 'angry';
    };

    const handleSubmitOffer = async () => {
        setIsAnimating(true);
        setPhase('negotiating');

        // Start or continue negotiation
        try {
            let negId = negotiationId;
            if (!negId) {
                const result = await initiateNegotiation.mutateAsync({
                    workspaceId,
                    playerId: player.id,
                    playerName: player.name,
                    askingPrice: player.askingPrice,
                    initialOffer: offer,
                });
                negId = result.id;
                setNegotiationId(result.id);
            } else {
                await updateNegotiation.mutateAsync({
                    id: negId,
                    workspaceId,
                    currentOffer: offer,
                    incrementRound: true,
                });
            }

            // Simulate negotiation delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mood = calculateAgentMood(offer, player.askingPrice);
            setAgentMood(mood);
            setAgentMessage(AGENT_RESPONSES[mood][Math.floor(Math.random() * AGENT_RESPONSES[mood].length)]);

            // Calculate counter offer
            const diff = player.askingPrice - offer;
            const counter = Math.floor(offer + diff * 0.5);
            setCounterOffer(counter);

            // Check for deal
            const ratio = offer / player.askingPrice;
            if (ratio >= 0.9 || round >= maxRounds) {
                if (ratio >= 0.85) {
                    setResult('accepted');
                    await updateNegotiation.mutateAsync({
                        id: negId!,
                        workspaceId,
                        status: 'accepted',
                        agentMood: 'happy',
                    });
                } else {
                    setResult('rejected');
                    await updateNegotiation.mutateAsync({
                        id: negId!,
                        workspaceId,
                        status: 'rejected',
                        agentMood: mood,
                    });
                }
                setPhase('result');
            } else {
                setRound(r => r + 1);
                setPhase('offer');
            }
        } catch (error) {
            console.error('Negotiation error:', error);
        }

        setIsAnimating(false);
    };

    const handleAcceptCounter = () => {
        setOffer(counterOffer);
        handleSubmitOffer();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={phase !== 'negotiating' ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-b from-[#1A1C14] to-[#0E100A] border border-primary/30 rounded-3xl shadow-[0_0_100px_rgba(210,249,111,0.15)] overflow-hidden">

                {/* Header */}
                <div className="relative px-8 py-6 border-b border-white/10 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-icons-outlined text-primary text-2xl animate-pulse">handshake</span>
                            <div>
                                <h2 className="text-xl font-bold text-white">Player Negotiations</h2>
                                <p className="text-xs text-gray-400 font-mono">ROUND {round} OF {maxRounds}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
                        >
                            <span className="material-icons-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Phase: Intro Animation */}
                {phase === 'intro' && (
                    <div className="p-12 flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
                        <div className="relative w-32 h-32 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-30" />
                            <div className="absolute inset-2 rounded-full border-2 border-dashed border-primary/50 animate-spin-slow" />
                            <div className="absolute inset-4 rounded-full bg-surface-dark flex items-center justify-center overflow-hidden">
                                {player.avatarUrl ? (
                                    <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-primary">{player.name.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 animate-slide-up">{player.name}</h3>
                        <p className="text-gray-400 text-sm animate-slide-up delay-100">{player.role} • {player.team}</p>
                        <div className="mt-6 flex items-center gap-2 animate-slide-up delay-200">
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-75" />
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-150" />
                            <span className="text-xs text-gray-500 ml-2">Connecting to agent...</span>
                        </div>
                    </div>
                )}

                {/* Phase: Make Offer */}
                {phase === 'offer' && (
                    <div className="p-8 min-h-[400px]">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Player Card */}
                            <div className="bg-surface-dark rounded-2xl p-6 border border-white/5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                                        {player.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{player.name}</h4>
                                        <p className="text-xs text-gray-400">{player.role} • {player.team}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Asking Price</span>
                                        <span className="text-primary font-bold font-mono">${(player.askingPrice / 1000).toFixed(0)}k</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Market Value</span>
                                        <span className="text-gray-300 font-mono">${(player.askingPrice * 0.9 / 1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                            </div>

                            {/* Offer Input */}
                            <div className="flex flex-col justify-center">
                                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your Offer</label>
                                <div className="relative mb-4">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-xl font-bold">$</span>
                                    <input
                                        type="number"
                                        value={offer / 1000}
                                        onChange={(e) => setOffer(Number(e.target.value) * 1000)}
                                        className="w-full pl-10 pr-4 py-4 bg-surface-darker border border-primary/30 rounded-xl text-2xl font-bold text-white font-mono focus:outline-none focus:border-primary focus:shadow-neon transition"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">k</span>
                                </div>
                                <input
                                    type="range"
                                    min={player.askingPrice * 0.5}
                                    max={player.askingPrice * 1.2}
                                    step={1000}
                                    value={offer}
                                    onChange={(e) => setOffer(Number(e.target.value))}
                                    className="w-full h-2 bg-surface-darker rounded-full appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                                    <span>${(player.askingPrice * 0.5 / 1000).toFixed(0)}k</span>
                                    <span>${(player.askingPrice * 1.2 / 1000).toFixed(0)}k</span>
                                </div>

                                {counterOffer > 0 && (
                                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                        <p className="text-xs text-yellow-400 mb-1">Counter Offer:</p>
                                        <p className="text-lg font-bold text-yellow-400 font-mono">${(counterOffer / 1000).toFixed(0)}k</p>
                                        <button
                                            onClick={handleAcceptCounter}
                                            className="mt-2 w-full py-2 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg hover:bg-yellow-500/30 transition"
                                        >
                                            Accept Counter
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Agent Response */}
                        {agentMessage && (
                            <div className={`mt-6 p-4 rounded-xl border ${agentMood === 'happy' ? 'bg-green-500/10 border-green-500/30' :
                                    agentMood === 'neutral' ? 'bg-blue-500/10 border-blue-500/30' :
                                        agentMood === 'frustrated' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                            'bg-red-500/10 border-red-500/30'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{agentAvatar}</span>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Agent Response:</p>
                                        <p className={`text-sm italic ${agentMood === 'happy' ? 'text-green-400' :
                                                agentMood === 'neutral' ? 'text-blue-400' :
                                                    agentMood === 'frustrated' ? 'text-yellow-400' :
                                                        'text-red-400'
                                            }`}>"{agentMessage}"</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleSubmitOffer}
                            disabled={isAnimating}
                            className="w-full mt-6 py-4 bg-primary text-black font-bold text-lg rounded-xl hover:bg-primary-dark transition shadow-neon-strong flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-icons-outlined">send</span>
                            Submit Offer
                        </button>
                    </div>
                )}

                {/* Phase: Negotiating Animation */}
                {phase === 'negotiating' && (
                    <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                        <div className="relative w-24 h-24 mb-8">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Negotiating...</h3>
                        <p className="text-gray-400 text-sm">Agent is reviewing your offer</p>
                        <div className="mt-8 w-full max-w-xs">
                            <div className="h-2 bg-surface-darker rounded-full overflow-hidden">
                                <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: '60%' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase: Result */}
                {phase === 'result' && (
                    <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${result === 'accepted'
                                ? 'bg-green-500/20 border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                                : 'bg-red-500/20 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                            }`}>
                            <span className={`material-icons-outlined text-5xl ${result === 'accepted' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {result === 'accepted' ? 'check_circle' : 'cancel'}
                            </span>
                        </div>
                        <h3 className={`text-3xl font-bold mb-2 ${result === 'accepted' ? 'text-green-500' : 'text-red-500'
                            }`}>
                            {result === 'accepted' ? 'DEAL AGREED!' : 'TALKS COLLAPSED'}
                        </h3>
                        <p className="text-gray-400 text-center max-w-md mb-8">
                            {result === 'accepted'
                                ? `Congratulations! You've successfully signed ${player.name} for $${(offer / 1000).toFixed(0)}k.`
                                : `The agent has ended negotiations. ${player.name} will not be joining your roster.`
                            }
                        </p>
                        <button
                            onClick={onClose}
                            className={`px-8 py-3 font-bold rounded-xl transition ${result === 'accepted'
                                    ? 'bg-green-500 text-black hover:bg-green-400'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {result === 'accepted' ? 'Complete Signing' : 'Close'}
                        </button>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="px-8 pb-6">
                    <div className="flex items-center gap-2">
                        {[...Array(maxRounds)].map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-1 rounded-full transition-all ${i < round ? 'bg-primary shadow-neon' : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
                .delay-100 { animation-delay: 0.1s; opacity: 0; }
                .delay-200 { animation-delay: 0.2s; opacity: 0; }
                .animate-spin-slow { animation: spin 3s linear infinite; }
            `}</style>
        </div>
    );
};

export default InitiateTalksModal;
