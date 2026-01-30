import React from 'react';

interface LogoProps {
    className?: string;
    iconSize?: number;
    textSize?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "", iconSize = 20, textSize = "text-xl" }) => {
    return (
        <div className={`flex items-center gap-3 select-none ${className}`}>
            <div className="w-10 h-10 bg-[#D2F96F] rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(210,249,111,0.3)] transition-transform group-hover:scale-110 duration-300">
                <span
                    className="material-icons text-black -rotate-45"
                    style={{ fontSize: `${iconSize}px` }}
                >
                    sports_esports
                </span>
            </div>
            <span className={`${textSize} font-bold tracking-tight text-white font-display`}>
                MetaCoach
            </span>
        </div>
    );
};

export default Logo;
