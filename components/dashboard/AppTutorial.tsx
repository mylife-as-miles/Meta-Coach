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

    // Determine which steps to show based on URL
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    const isHistory = location.pathname.includes('/match-history');

    let steps = syncTutorialSteps;
    if (isDashboard) steps = dashboardTutorialSteps;
    else if (isHistory) steps = historyTutorialSteps;

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
        } else {
            const hasSeenSync = localStorage.getItem('metacoach_sync_tutorial_seen');
            if (!hasSeenSync) setRun(true);
            else setRun(false);
        }
    }, [location.pathname, isDashboard, isHistory]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index, action } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            setRun(false);
            if (isDashboard) {
                localStorage.setItem('metacoach_dashboard_tutorial_seen', 'true');
            } else if (isHistory) {
                localStorage.setItem('metacoach_history_tutorial_seen', 'true');
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
