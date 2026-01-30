import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile, Sequence } from 'remotion';

const FONT_UI = '"Inter", sans-serif';
const FONT_DATA = '"Courier New", monospace';
const COLOR_LIME = '#D2F96F';
const COLOR_BLACK = '#0E100A';

// --- Scene 1: Intro (0-5s) ---
const SceneIntro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity1 = interpolate(frame, [0, 10, 60, 70], [0, 1, 1, 0]);
    const opacity2 = interpolate(frame, [75, 85, 135, 145], [0, 1, 1, 0]);

    return (
        <AbsoluteFill style={{ backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ fontFamily: FONT_UI, color: 'white', fontSize: 80, fontWeight: 800, opacity: opacity1, letterSpacing: '-2px' }}>
                Intelligence.
            </h1>
            <h1 style={{ fontFamily: FONT_UI, color: COLOR_LIME, fontSize: 80, fontWeight: 800, opacity: opacity2, letterSpacing: '-2px' }}>
                Redefined.
            </h1>
        </AbsoluteFill>
    );
};

// --- Scene 2: The Hook (5-15s) ---
const SceneHook: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const texts = [
        { text: "For Professional Coaches.", start: 0, end: 90 },
        { text: "For Elite Analysts.", start: 90, end: 180 },
        { text: "For Victory.", start: 180, end: 300, color: COLOR_LIME }
    ];

    return (
        <AbsoluteFill style={{ backgroundColor: COLOR_BLACK, justifyContent: 'center', alignItems: 'center' }}>
            {texts.map((item, index) => {
                const relativeFrame = frame - item.start;
                if (frame < item.start || frame > item.end) return null;

                const slideUp = spring({ fps, frame: relativeFrame, config: { damping: 20 } });
                const opacity = interpolate(relativeFrame, [0, 10], [0, 1]);

                return (
                    <h1 key={index} style={{
                        fontFamily: FONT_UI,
                        color: item.color || 'white',
                        fontSize: 70,
                        fontWeight: 700,
                        opacity,
                        transform: `translateY(${50 - (slideUp * 50)}px)`
                    }}>
                        {item.text}
                    </h1>
                );
            })}
        </AbsoluteFill>
    );
};

// --- Scene 3: Dashboard Showcase (15-35s) ---
const SceneShowcase: React.FC = () => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    // Pan effect: Zoom in and move across the image
    // Image is assumed HD/4K. We scale it up.
    // T = 0 -> Scale 1.2, Center
    // T = End -> Scale 1.3, Pan Right

    const scale = interpolate(frame, [0, 600], [1.1, 1.3]);
    const translateX = interpolate(frame, [0, 600], [0, -100]);
    const translateY = interpolate(frame, [0, 600], [0, -50]);

    return (
        <AbsoluteFill style={{ backgroundColor: COLOR_BLACK, overflow: 'hidden' }}>
            <AbsoluteFill style={{
                transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                transformOrigin: 'center center'
            }}>
                <Img src={staticFile('dashboard-preview.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </AbsoluteFill>

            {/* Overlays */}
            <AbsoluteFill style={{ justifyContent: 'flex-end', padding: 60 }}>
                <Sequence from={30}>
                    <div style={{ fontFamily: FONT_DATA, color: 'white', fontSize: 32, backgroundColor: 'rgba(0,0,0,0.7)', padding: '10px 20px', alignSelf: 'flex-start', borderLeft: `4px solid ${COLOR_LIME}` }}>
                        REAL-TIME TELEMETRY
                    </div>
                </Sequence>
                <Sequence from={300}>
                    <div style={{ fontFamily: FONT_DATA, color: 'white', fontSize: 32, backgroundColor: 'rgba(0,0,0,0.7)', padding: '10px 20px', alignSelf: 'flex-start', marginTop: 20, borderLeft: `4px solid ${COLOR_LIME}` }}>
                        LIVE ROSTER SYNC
                    </div>
                </Sequence>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

// --- Scene 4: AI Features (35-50s) ---
const SceneAI: React.FC = () => {
    const frame = useCurrentFrame();

    // Pulse effect
    const pulse = Math.sin(frame / 10) * 0.1 + 1; // 0.9 to 1.1

    return (
        <AbsoluteFill style={{ backgroundColor: COLOR_BLACK, justifyContent: 'center', alignItems: 'center' }}>
            {/* Grid Background */}
            <AbsoluteFill style={{ opacity: 0.2, backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Pulsing Core */}
            <div style={{
                width: 200, height: 200,
                borderRadius: '50%',
                border: `4px solid ${COLOR_LIME}`,
                boxShadow: `0 0 50px ${COLOR_LIME}`,
                transform: `scale(${pulse})`,
                display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
                <span style={{ fontFamily: FONT_UI, fontSize: 80, color: 'white' }}>AI</span>
            </div>

            <Sequence from={30}>
                <h2 style={{ fontFamily: FONT_UI, color: 'white', marginTop: 300, fontSize: 40 }}>Powered by Gemini 2.0</h2>
            </Sequence>
            <Sequence from={150}>
                <h2 style={{ fontFamily: FONT_UI, color: COLOR_LIME, marginTop: 20, fontSize: 50 }}>Predictive Strategy</h2>
            </Sequence>
        </AbsoluteFill>
    );
}

// --- Scene 5: Outro (50-60s) ---
const SceneOutro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scale = spring({
        fps,
        frame,
        config: { damping: 12, mass: 0.5 },
        from: 3,
        to: 1
    });

    const opacity = interpolate(frame, [0, 30], [0, 1]);

    return (
        <AbsoluteFill style={{ backgroundColor: COLOR_BLACK, justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ transform: `scale(${scale})`, opacity }}>
                <Img src={staticFile('logo.svg')} style={{ width: 300 }} />
            </div>
            <Sequence from={45}>
                <h1 style={{ fontFamily: FONT_UI, color: 'white', marginTop: 40, fontSize: 60, opacity: interpolate(frame - 45, [0, 20], [0, 1]) }}>
                    MetaCoach
                </h1>
                <p style={{ fontFamily: FONT_DATA, color: '#888', fontSize: 24, marginTop: 10, opacity: interpolate(frame - 60, [0, 20], [0, 1]) }}>
                    metacoach.gg
                </p>
            </Sequence>
        </AbsoluteFill>
    );
};


export const LaunchVideo: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: COLOR_BLACK }}>
            <Sequence from={0} durationInFrames={150}>
                <SceneIntro />
            </Sequence>
            <Sequence from={150} durationInFrames={300}>
                <SceneHook />
            </Sequence>
            <Sequence from={450} durationInFrames={600}>
                <SceneShowcase />
            </Sequence>
            <Sequence from={1050} durationInFrames={450}>
                <SceneAI />
            </Sequence>
            <Sequence from={1500} durationInFrames={300}>
                <SceneOutro />
            </Sequence>
        </AbsoluteFill>
    );
};
