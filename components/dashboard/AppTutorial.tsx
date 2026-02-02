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
                    textColor: '#000',
                    backgroundColor: '#fff',
                    arrowColor: '#fff',
                },
                tooltip: {
                    borderRadius: '12px',
                    fontFamily: 'Inter, sans-serif'
                },
                buttonNext: {
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    color: '#000'
                },
                buttonBack: {
                    color: '#666'
                }
            }}
        />
    );
};

export default AppTutorial;
