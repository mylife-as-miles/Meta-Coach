import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';

const AppTutorial: React.FC = () => {
    const [run, setRun] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Define different tutorials
    const syncTutorialSteps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            content: (
                <div className="text-left">
                    <h3 className="text-xl font-bold mb-2">Welcome to MetaCoach V2</h3>
                    <p className="text-sm">
                        This update introduces the <strong>Auto-Scout Intelligence Engine</strong>.
                        To power it, we need to sync your local database with the Canonical Match History.
                    </p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: 'nav a[href="/dashboard/settings"]', // Updated selector
            content: 'First, head over to the Settings page.',
            spotlightClicks: true,
            disableBeacon: true,
        },
        {
            target: '#sync-history-btn',
            content: (
                <div className="text-left">
                    <h3 className="font-bold mb-2">Sync Historical Data</h3>
                    <p className="text-sm">
                        Click this button to fetch official match data from GRID.
                        <br /><br />
                        This populates your local Supabase cache, which <strong>Auto-Scout</strong> uses to generate volatility ratings and playstyle analysis.
                    </p>
                </div>
            ),
            placement: 'top',
            spotlightClicks: true,
        },
        {
            target: 'nav a[href="/dashboard/scout"]', // Updated selector
            content: 'Once synced, go to the Market/Scouting page to see the AI in action!',
        }
    ];

    const dashboardTutorialSteps: Step[] = [
        {
            target: '#dashboard-header',
            content: (
                <div className="text-left">
                    <h3 className="text-lg font-bold mb-1 italic text-primary">Live Operations Dashboard</h3>
                    <p className="text-sm opacity-90">Welcome to your tactical nerve center. Here we synthesize real-time data into strategic intelligence.</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '#upcoming-match-card',
            content: 'Your next opponent is automatically analyzed. Use the "Strategy Brief" to see current win-conditions based on historical trends.',
            placement: 'right',
        },
        {
            target: '#recent-matches-card',
            content: 'Review previous results. Notice the AI Performance Summary bars indicating macro control and micro consistency.',
            placement: 'right',
        },
        {
            target: '#strategic-projection-map',
            content: 'This projection visualizes predicted rotations and high-impact zones for your next matchup.',
            placement: 'left',
        },
        {
            target: '#high-impact-plays-list',
            content: 'Detailed AI breakdown of specific game-turning moments. Higher scores indicate superior execution.',
            placement: 'top',
        },
        {
            target: '#active-roster-sidebar',
            content: 'Monitor your squad. Synergy ratings are calculated from dual-source historical synergies and current form.',
            placement: 'left',
        },
        {
            target: '#launch-strategy-lab-btn',
            content: 'Ready for deep dive? Launch the Strategy Lab for 3D simulation and draft planning.',
            placement: 'top',
        }
    ];

    const historyTutorialSteps: Step[] = [
        {
            target: '#match-history-header',
            content: (
                <div className="text-left">
                    <h3 className="text-lg font-bold mb-1 italic text-primary">Strategic Archive</h3>
                    <p className="text-sm opacity-90">Explore your team's historical performance. Every match here is augmented with AI-driven summaries.</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '#match-list-container',
            content: 'The match list provides quick insights into results, scores, and AI performance metrics like Macro Control.',
            placement: 'bottom',
        },
        {
            target: '#performance-trends-card',
            content: 'This chart tracks your strategic efficiency over the last 10 games, helping you spot form improvements or slumps.',
            placement: 'left',
        },
        {
            target: '#gemini-retrospective-card',
            content: 'The Retrospective engine identifies recurring patterns and systemic weaknesses across your recent performance.',
            placement: 'left',
        },
        {
            target: '#performance-kpis',
            content: 'Key metrics like Average Win Duration and First Blood percentage give you a baseline for your team\'s tempo.',
            placement: 'top',
        },
        {
            target: '#load-more-btn',
            content: 'Need to go further back? Load more matches to expand your analysis.',
            placement: 'top',
        }
    ];

    const playerHubTutorialSteps: Step[] = [
        {
            target: '#player-hub-header',
            content: (
                <div className="text-left">
                    <h3 className="text-lg font-bold mb-1 italic text-primary">Player Intelligence Hub</h3>
                    <p className="text-sm opacity-90">Deep-dive into individual performance. This page combines raw GRID data with Gemini-powered growth predictions.</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '#gemini-potential-card',
            content: 'Gemini analyzes current mechanics and game-sense to project the player\'s peak potential. Notice the trajectory graph indicating growth speed.',
            placement: 'right',
        },
        {
            target: '#player-card-container',
            content: 'The high-fidelity player card displays core attributes (Mechanics, Macro, Mental, etc.) extracted from official match data.',
            placement: 'right',
        },
        {
            target: '#player-hex-chart',
            content: 'A rapid-glance radar chart visualizing attribute balance. Perfectly balanced "Hex" shapes are rare and indicate elite versatility.',
            placement: 'left',
        },
        {
            target: '#tactical-synergies-card',
            content: 'AI-calculated synergy scores with other roster members. High percentages lead to more successful set-plays and map control.',
            placement: 'left',
        },
        {
            target: '#match-performance-section',
            content: 'Raw performance data from GRID. Track win-rates, KDA trends over time, and detailed damage metrics across tournaments.',
            placement: 'top',
        },
        {
            target: '#active-roster-selector',
            content: 'Quickly switch between roster members to compare form and identifying who\'s ready for the next match.',
            placement: 'top',
        }
    ];

    const scoutTutorialSteps: Step[] = [
        {
            target: '#scout-header',
            content: (
                <div className="text-left">
                    <h3 className="text-lg font-bold mb-1 italic text-primary">Sabermetrics Market Scout</h3>
                    <p className="text-sm opacity-90">Identify and exploit market inefficiencies. This system uses advanced algorithms to find undervalued assets globally.</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '#market-opportunities-list',
            content: 'A real-time list of available players. Look for the "WAR" (Wins Above Replacement) metric to identify high-impact targets.',
            placement: 'right',
        },
        {
            target: '#scout-analysis-center',
            content: 'The "Confirmed Target" view provides a deep analysis of your current selection, comparing them against the global benchmark.',
            placement: 'bottom',
        },
        {
            target: '#auto-scout-intelligence',
            content: 'Direct AI intelligence layer. This identifies hidden patterns like early pressure consistency and volatility levels.',
            placement: 'top',
        },
        {
            target: '#market-comparison-sidebar',
            content: 'Side-by-side metric comparison. Use this to visualize the "WAR Differential" between your target and a comparison asset.',
            placement: 'left',
        },
        {
            target: '#ai-scout-report-btn',
            content: 'Ready to finalize? Generate a full AI Strategic Report for a comprehensive breakdown of the acquisition value.',
            placement: 'top',
        }
    ];

    const strategyTutorialSteps: Step[] = [
        {
            target: '#draft-simulator-section',
            content: (
                <div className="text-left">
                    <h3 className="text-lg font-bold mb-1 italic text-primary">Strategy Lab</h3>
                    <p className="text-sm opacity-90">Welcome to the War Room. Here you can simulate drafts and game scenarios using real-time GRID data and Gemini analysis.</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '#draft-simulator-section',
            content: 'The Draft Simulator tracks win probability in real-time. Select champions for both sides to see how the meta-matchup evolves.',
            placement: 'right',
        },
        {
            target: '#tactical-map-container',
            content: 'The 3D Tactical Map visualizes pathing and position-based advantages. Use it to identify map control inefficiencies.',
            placement: 'bottom',
        },
        {
            target: '#tactical-briefing-console',
            content: 'The Gemini Tactical Briefing console provides a technical log of patterns detected during simulation.',
            placement: 'top',
        },
        {
            target: '#scenario-variables-sidebar',
            content: 'Fine-tune the simulation. Adjust gold advantage, game phase, and player fatigue to stress-test your team\'s strategies.',
            placement: 'left',
        },
        {
            target: '#run-simulation-btn',
            content: 'Once your variables are set, run a full simulation to generate a Strategic Outcome report.',
            placement: 'top',
        }
    ];

    // Determine which steps to show based on URL
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    const isHistory = location.pathname.includes('/match-history');
    const isPlayerHub = location.pathname.includes('/player-hub');
    const isScout = location.pathname.includes('/scout');
    const isStrategy = location.pathname.includes('/strategy-lab');

    let steps = syncTutorialSteps;
    if (isDashboard) steps = dashboardTutorialSteps;
    else if (isHistory) steps = historyTutorialSteps;
    else if (isPlayerHub) steps = playerHubTutorialSteps;
    else if (isScout) steps = scoutTutorialSteps;
    else if (isStrategy) steps = strategyTutorialSteps;

    // Separate tracking for dashboard tutorial
    useEffect(() => {
        if (isDashboard) {
            const seenDashboard = localStorage.getItem('metacoach_dashboard_tutorial_seen');
            if (!seenDashboard) setRun(true);
            else setRun(false);
        } else if (isHistory) {
            const seenHistory = localStorage.getItem('metacoach_history_tutorial_seen');
            if (!seenHistory) setRun(true);
            else setRun(false);
        } else if (isPlayerHub) {
            const seenPlayer = localStorage.getItem('metacoach_player_tutorial_seen');
            if (!seenPlayer) setRun(true);
            else setRun(false);
        } else if (isScout) {
            const seenScout = localStorage.getItem('metacoach_scout_tutorial_seen');
            if (!seenScout) setRun(true);
            else setRun(false);
        } else if (isStrategy) {
            const seenStrategy = localStorage.getItem('metacoach_strategy_tutorial_seen');
            if (!seenStrategy) setRun(true);
            else setRun(false);
        } else {
            const hasSeenSync = localStorage.getItem('metacoach_sync_tutorial_seen');
            if (!hasSeenSync) setRun(true);
            else setRun(false);
        }
    }, [location.pathname, isDashboard, isHistory, isPlayerHub, isScout, isStrategy]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index, action } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            setRun(false);
            if (isDashboard) {
                localStorage.setItem('metacoach_dashboard_tutorial_seen', 'true');
            } else if (isHistory) {
                localStorage.setItem('metacoach_history_tutorial_seen', 'true');
            } else if (isPlayerHub) {
                localStorage.setItem('metacoach_player_tutorial_seen', 'true');
            } else if (isScout) {
                localStorage.setItem('metacoach_scout_tutorial_seen', 'true');
            } else if (isStrategy) {
                localStorage.setItem('metacoach_strategy_tutorial_seen', 'true');
            } else {
                localStorage.setItem('metacoach_sync_tutorial_seen', 'true');
            }
        }

        // Navigation logic for sync tutorial
        if (!isDashboard && type === 'step:after') {
            if (index === 1 && action === 'next') {
                navigate('/dashboard/settings');
            }
            if (index === 2 && action === 'next') {
                navigate('/dashboard/scout');
            }
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#D2F96F',
                    textColor: '#FFFFFF',
                    backgroundColor: '#1E201B', // Dark surface matching app cards
                    arrowColor: '#1E201B',
                    overlayColor: 'rgba(0, 0, 0, 0.85)',
                    zIndex: 10000,
                },
                tooltip: {
                    borderRadius: '16px',
                    fontFamily: 'Inter, sans-serif',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                },
                buttonNext: {
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    color: '#000',
                    outline: 'none',
                    boxShadow: '0 0 15px rgba(210, 249, 111, 0.3)',
                    padding: '10px 16px'
                },
                buttonBack: {
                    color: '#9CA3AF',
                    marginRight: '10px'
                },
                buttonSkip: {
                    color: '#6B7280'
                }
            }}
        />
    );
};

export default AppTutorial;
