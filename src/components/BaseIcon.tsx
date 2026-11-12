import React from 'react';

interface BaseIconProps {
    level: number;
    className?: string;
    size?: number;
}

export const BaseIcon: React.FC<BaseIconProps> = ({ level, className, size = 64 }) => {
    // Common Definitions (Gradients, Filters)
    const defs = (
        <defs>
            <linearGradient id="podGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="domeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
            <linearGradient id="fireGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <style>
                {`
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes smoke { 0% { transform: translateY(0) scale(1); opacity: 0.8; } 100% { transform: translateY(-20px) scale(2); opacity: 0; } }
          .blink-anim { animation: blink 2s infinite; }
          .smoke-anim-1 { animation: smoke 3s infinite; transform-origin: center; }
          .smoke-anim-2 { animation: smoke 3s infinite 1.5s; transform-origin: center; }
        `}
            </style>
        </defs>
    );

    const renderLevel0 = () => (
        <g>
            {/* Drop Pod */}
            <ellipse cx="50" cy="80" rx="25" ry="8" fill="#1e293b" opacity="0.4" /> {/* Shadow */}
            <path d="M35 80 L30 50 L50 20 L70 50 L65 80 Z" fill="url(#podGradient)" stroke="#475569" strokeWidth="2" />
            <rect x="45" y="55" width="10" height="15" fill="#334155" rx="1" /> {/* Door */}
            <circle cx="50" cy="20" r="3" fill="#ef4444" className="blink-anim" /> {/* Beacon */}
            <path d="M30 50 L20 85" stroke="#94a3b8" strokeWidth="2" /> {/* Leg L */}
            <path d="M70 50 L80 85" stroke="#94a3b8" strokeWidth="2" /> {/* Leg R */}
        </g>
    );

    const renderLevel1 = () => (
        <g>
            {/* Pod + Tent */}
            <ellipse cx="65" cy="80" rx="35" ry="10" fill="#1e293b" opacity="0.4" />

            {/* Basic Pod (Background) */}
            <path d="M25 75 L22 55 L35 35 L48 55 L45 75 Z" fill="#64748b" stroke="#334155" strokeWidth="1" />

            {/* Habitat Dome */}
            <path d="M40 80 Q40 50 70 50 Q100 50 100 80" fill="url(#domeGradient)" stroke="#0ea5e9" strokeWidth="2" />
            <rect x="60" y="65" width="20" height="15" fill="#e0f2fe" opacity="0.8" /> {/* Window */}
            <rect x="62" y="67" width="16" height="11" fill="#fef08a" className="blink-anim" opacity="0.6" /> {/* Light inside */}

            {/* Solar Panel */}
            <line x1="15" y1="80" x2="15" y2="60" stroke="#94a3b8" strokeWidth="2" />
            <rect x="5" y="50" width="20" height="12" fill="#1e3a8a" transform="rotate(-20 15 60)" stroke="#silver" strokeWidth="1" />
        </g>
    );

    const renderLevel2 = () => (
        <g>
            {/* Supply Depot */}
            <ellipse cx="50" cy="80" rx="40" ry="12" fill="#1e293b" opacity="0.4" />

            {/* Main Hub */}
            <rect x="30" y="55" width="40" height="25" fill="#475569" stroke="#1e293b" strokeWidth="2" />
            <rect x="35" y="45" width="30" height="10" fill="#64748b" stroke="#1e293b" strokeWidth="1" />

            {/* Crates */}
            <rect x="10" y="70" width="15" height="10" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <rect x="10" y="60" width="15" height="10" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <rect x="75" y="70" width="15" height="10" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />

            {/* Crane Arm */}
            <line x1="50" y1="45" x2="50" y2="25" stroke="#94a3b8" strokeWidth="3" />
            <line x1="50" y1="25" x2="80" y2="35" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="50" cy="25" r="2" fill="#ef4444" className="blink-anim" />
        </g>
    );

    const renderLevel3 = () => (
        <g>
            {/* Smelter */}
            <ellipse cx="50" cy="80" rx="45" ry="15" fill="#1e293b" opacity="0.4" />

            {/* Factory Building */}
            <rect x="25" y="50" width="50" height="30" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            <rect x="30" y="60" width="15" height="20" fill="#f59e0b" filter="url(#glow)" opacity="0.5" className="blink-anim" /> {/* Furnace Glow */}

            {/* Chimney */}
            <rect x="65" y="30" width="10" height="50" fill="#57534e" stroke="#292524" strokeWidth="2" />
            <rect x="63" y="25" width="14" height="5" fill="#44403c" />

            {/* Smoke */}
            <circle cx="70" cy="20" r="4" fill="#a8a29e" className="smoke-anim-1" />
            <circle cx="70" cy="20" r="3" fill="#a8a29e" className="smoke-anim-2" />
        </g>
    );

    const renderLevel4 = () => (
        <g>
            {/* Habitat Complex */}
            <rect x="20" y="50" width="20" height="30" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
            <rect x="40" y="40" width="30" height="40" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
            <rect x="70" y="55" width="20" height="25" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />

            {/* Windows */}
            <rect x="25" y="55" width="10" height="5" fill="#bae6fd" />
            <rect x="25" y="65" width="10" height="5" fill="#bae6fd" />
            <rect x="45" y="50" width="20" height="5" fill="#bae6fd" />
            <rect x="45" y="60" width="20" height="5" fill="#bae6fd" className="blink-anim" />
            <rect x="75" y="60" width="10" height="5" fill="#bae6fd" />

            {/* Roof details */}
            <path d="M40 40 L55 30 L70 40 Z" fill="#94a3b8" />
        </g>
    );

    const renderLevel5 = () => (
        <g>
            {/* Comms Tower */}
            <rect x="45" y="50" width="10" height="30" fill="#64748b" />
            <path d="M45 80 L30 100 M55 80 L70 100" stroke="#64748b" strokeWidth="3" />

            {/* Dish */}
            <g transform="rotate(-30 50 40)">
                <path d="M30 40 Q50 60 70 40" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
                <line x1="50" y1="50" x2="50" y2="30" stroke="#ef4444" strokeWidth="2" className="blink-anim" />
            </g>

            {/* Base Building */}
            <rect x="30" y="70" width="40" height="20" fill="#334155" stroke="#1e293b" strokeWidth="2" opacity="0.9" />
            <circle cx="35" cy="75" r="2" fill="#22c55e" className="blink-anim" />
            <circle cx="40" cy="75" r="2" fill="#22c55e" className="blink-anim" style={{ animationDelay: '0.5s' }} />
        </g>
    );

    const renderLevel6 = () => (
        <g>
            {/* Refinery */}
            {/* Tanks */}
            <rect x="20" y="40" width="20" height="40" rx="2" fill="#0369a1" stroke="#075985" strokeWidth="2" />
            <rect x="70" y="40" width="20" height="40" rx="2" fill="#0369a1" stroke="#075985" strokeWidth="2" />

            {/* Piping */}
            <path d="M40 70 H70" stroke="#c084fc" strokeWidth="4" strokeDasharray="5,2" />
            <path d="M30 40 V30 H80 V40" stroke="#94a3b8" strokeWidth="3" fill="none" />

            {/* Central Unit */}
            <rect x="45" y="50" width="20" height="30" fill="#475569" stroke="#1e293b" strokeWidth="2" />
            <circle cx="55" cy="65" r="5" fill="#fbbf24" filter="url(#glow)" className="blink-anim" />
        </g>
    );

    const renderLevel7 = () => (
        <g>
            {/* Power Plant */}
            {/* Cooling Towers */}
            <path d="M20 80 L25 40 L45 40 L50 80 Z" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="2" />
            <path d="M60 80 L65 40 L85 40 L90 80 Z" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="2" />

            {/* Steam */}
            <circle cx="35" cy="30" r="5" fill="#e5e5e5" opacity="0.6" className="smoke-anim-1" />
            <circle cx="75" cy="30" r="5" fill="#e5e5e5" opacity="0.6" className="smoke-anim-2" />

            {/* Reactor Core */}
            <rect x="45" y="60" width="20" height="20" fill="#1e293b" />
            <circle cx="55" cy="70" r="4" fill="#60a5fa" filter="url(#glow)" className="blink-anim" />
        </g>
    );

    const renderLevel8 = () => (
        <g>
            {/* Laboratory */}
            <rect x="25" y="45" width="50" height="40" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" rx="4" />
            <rect x="30" y="50" width="40" height="15" fill="#7dd3fc" opacity="0.4" />

            {/* Hologram Projector */}
            <ellipse cx="50" cy="45" rx="10" ry="3" fill="#0ea5e9" />
            <path d="M45 45 L40 25 L60 25 L55 45 Z" fill="url(#domeGradient)" opacity="0.5" className="blink-anim" />

            {/* Antennas */}
            <line x1="30" y1="45" x2="30" y2="25" stroke="#94a3b8" strokeWidth="1" />
            <line x1="70" y1="45" x2="70" y2="25" stroke="#94a3b8" strokeWidth="1" />
        </g>
    );

    const renderLevel9 = () => (
        <g>
            {/* Command Center */}
            <path d="M30 80 L35 50 L65 50 L70 80 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            <rect x="40" y="40" width="20" height="10" fill="#334155" />

            {/* Big Radar/Turret */}
            <circle cx="50" cy="40" r="8" fill="#475569" />
            <line x1="50" y1="40" x2="70" y2="30" stroke="#ef4444" strokeWidth="2" />

            {/* Defensive Walls */}
            <rect x="10" y="70" width="15" height="15" fill="#64748b" />
            <rect x="75" y="70" width="15" height="15" fill="#64748b" />
        </g>
    );

    const renderLevel10 = () => (
        <g>
            {/* Spaceport */}
            <rect x="10" y="75" width="80" height="10" fill="#334155" stroke="#1e293b" strokeWidth="2" /> {/* Pad */}

            {/* Lights on Pad */}
            <circle cx="20" cy="80" r="2" fill="#fbbf24" className="blink-anim" />
            <circle cx="80" cy="80" r="2" fill="#fbbf24" className="blink-anim" style={{ animationDelay: '0.5s' }} />

            {/* Shuttle */}
            <path d="M40 75 L45 40 L55 40 L60 75 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            <path d="M35 75 L40 60 L45 75 Z" fill="#94a3b8" /> {/* Wing L */}
            <path d="M65 75 L60 60 L55 75 Z" fill="#94a3b8" /> {/* Wing R */}
        </g>
    );

    const renderLevel11 = () => (
        <g>
            {/* Citadel (Mega Base) */}
            <path d="M30 85 L40 20 L60 20 L70 85 Z" fill="url(#domeGradient)" stroke="#0ea5e9" strokeWidth="2" />
            <rect x="45" y="10" width="10" height="80" fill="#f0f9ff" opacity="0.5" /> {/* Beam center */}

            {/* Rings */}
            <ellipse cx="50" cy="30" rx="25" ry="5" stroke="#e0f2fe" strokeWidth="2" fill="none" transform="rotate(10 50 30)" />
            <ellipse cx="50" cy="50" rx="30" ry="8" stroke="#e0f2fe" strokeWidth="2" fill="none" transform="rotate(-5 50 50)" />

            {/* Energy Particle */}
            <circle cx="50" cy="15" r="4" fill="#ffffff" filter="url(#glow)" className="blink-anim" />
        </g>
    );

    const renderContent = () => {
        switch (true) {
            case level >= 11: return renderLevel11();
            case level === 10: return renderLevel10();
            case level === 9: return renderLevel9();
            case level === 8: return renderLevel8();
            case level >= 7: return renderLevel7();
            case level === 6: return renderLevel6();
            case level === 5: return renderLevel5();
            case level === 4: return renderLevel4();
            case level === 3: return renderLevel3();
            case level === 2: return renderLevel2();
            case level === 1: return renderLevel1();
            default: return renderLevel0();
        }
    };

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {defs}
            {renderContent()}
        </svg>
    );
};
