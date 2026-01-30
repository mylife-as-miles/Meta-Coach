import { Composition } from 'remotion';
import { LaunchVideo } from './LaunchVideo.tsx';


export const Root: React.FC = () => {
    return (
        <>
            <Composition
                id="LaunchVideo"
                component={LaunchVideo}
                durationInFrames={1800} // 60 seconds at 30fps
                width={1280}
                height={720}
                fps={30}
                defaultProps={{}}
            />
        </>
    );
};
