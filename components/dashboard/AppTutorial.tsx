import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';

const AppTutorial: React.FC = () => {
    const [run, setRun] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Tutorial Steps
    const steps: Step[] = [
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
            target: 'nav a[href="/settings"]', // Assuming sidebar link
            content: 'First, head over to the Settings page.',
            spotlightClicks: true,
            disableBeacon: true,
            styles: {
                options: {
                    zIndex: 10000,
                },
            },
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
            styles: {
                options: {
                    zIndex: 10000,
                },
            },
        },
        {
            target: 'nav a[href="/scouting"]',
            content: 'Once synced, go to the Market/Scouting page to see the AI in action!',
        }
    ];

    // Auto-start on load (for demo) or check local storage
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('metacoach_sync_tutorial_seen');
        if (!hasSeenTutorial) {
            setRun(true);
        }
    }, []);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index, action } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            setRun(false);
            localStorage.setItem('metacoach_sync_tutorial_seen', 'true');
        }

        // Navigation logic for steps
        if (type === 'step:after') {
            if (index === 0) {
                // Creating a custom event to navigate or just letting user click if spotlight is enabled?
                // Ideally we navigate them programmatically if they click "Next"
            }
            if (index === 1 && action === 'next') {
                navigate('/settings');
            }
            if (index === 2 && action === 'next') {
                navigate('/scouting');
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
