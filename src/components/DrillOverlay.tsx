import React from 'react';
import { Pickaxe } from 'lucide-react';

interface DrillOverlayProps {
    depth: number;
    timeLeft: number; // in milliseconds
}

const RusticPickaxe: React.FC = () => (
    <Pickaxe className="w-12 h-12 text-slate-300 drop-shadow-lg animate-bounce" />
);

const IndustrialDrill: React.FC = () => (
    <svg viewBox="0 0 24 24" className="w-16 h-16 drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="1.5">
        {/* Drill Body */}
        <path d="M12 2C9 2 7 3 7 5v6h10V5c0-2-2-3-5-3z" className="fill-slate-700 stroke-slate-600" />

        {/* Rotating Bit Container */}
        <g className="origin-[12px_12px] animate-[spin_0.5s_linear_infinite]">
            {/* The Bit */}
            <path d="M12 11L9 14l3 2 3-2-3-2z" className="fill-slate-400" />
            <path d="M12 15l-3 3 1.5 1 1.5 2 1.5-2 1.5-1-3-3z" className="fill-slate-300" />
            {/* Spiral lines effect */}
            <path d="M9 14l3 3 3-3" stroke="black" strokeOpacity="0.3" />
            <path d="M10.5 18l1.5 2 1.5-2" stroke="black" strokeOpacity="0.3" />
        </g>

        {/* Side pistons/handles */}
        <path d="M7 6H5v4h2M17 6h2v4h-2" className="stroke-slate-500" strokeWidth="2" />
    </svg>
);

const LaserBore: React.FC = () => (
    <div className="relative flex flex-col items-center">
        {/* Laser Emitter */}
        <svg viewBox="0 0 24 24" className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10" fill="currentColor">
            <path d="M12 2a4 4 0 0 0-4 4v2h8V6a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v.5h-4V6a2 2 0 0 1 2-2z" />
            <rect x="6" y="9" width="12" height="4" rx="1" />
        </svg>
        {/* Beam */}
        <div className="w-2 h-24 bg-gradient-to-b from-cyan-400 to-transparent -mt-2 animate-pulse blur-[1px]"></div>
        <div className="absolute top-12 w-4 h-24 bg-cyan-500/20 blur-md animate-pulse"></div>
    </div>
);

export const DrillOverlay: React.FC<DrillOverlayProps> = ({ depth, timeLeft }) => {
    // Format time as MM:SS
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const renderDrillIcon = () => {
        if (depth < 3) return <RusticPickaxe />;
        if (depth < 7) return <IndustrialDrill />;
        return <LaserBore />;
    };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
            {/* Animated Drill */}
            <div className="mb-2">
                {renderDrillIcon()}
            </div>

            {/* Timer Badge */}
            <div className="bg-black/80 text-white text-xs font-mono font-bold px-2 py-1 rounded border border-white/20 shadow-xl backdrop-blur-sm">
                {timeString}
            </div>
        </div>
    );
};
