import React from 'react';

interface ResourceIconProps {
    type: string; // supports ResourceType | 'mineral' | 'rock' | 'soil'
    size?: number;
    className?: string;
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({ type, size = 20, className }) => {
    const renderGradients = () => (
        <defs>
            <filter id="iconGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            {/* Iron (Metallic Steel Grey) */}
            <linearGradient id="gradIron" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            {/* Copper (Warm Bronze/Orange) */}
            <linearGradient id="gradCopper" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="50%" stopColor="#c2410c" />
                <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
            {/* Lithium (Glowing Cyan/Teal) */}
            <linearGradient id="gradLithium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            {/* Bananium (Golden Sci-Fi Yellow) */}
            <linearGradient id="gradBananium" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            {/* Mineral (Deep Violet/Magenta) */}
            <linearGradient id="gradMineral" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
            {/* Credits (Glowing Neon Gold Coin) */}
            <linearGradient id="gradCredits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            {/* Water (Deep Liquid Blue) */}
            <linearGradient id="gradWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            {/* Food (Nutrient Green) */}
            <linearGradient id="gradFood" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            {/* Energy (Neon Yellow Bolt) */}
            <linearGradient id="gradEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            {/* Fuel (Combustible Orange/Red) */}
            <linearGradient id="gradFuel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            {/* Rock (Earth Slate) */}
            <linearGradient id="gradRock" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            {/* Soil (Soft Dirt Brown) */}
            <linearGradient id="gradSoil" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
        </defs>
    );

    const renderContent = () => {
        switch (type) {
            case 'iron':
                return (
                    <g>
                        {/* Hexagonal Metal Plate */}
                        <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="url(#gradIron)" stroke="#475569" strokeWidth="3" />
                        {/* Center Engraving */}
                        <polygon points="50,30 70,42 70,58 50,70 30,58 30,42" fill="none" stroke="#94a3b8" strokeWidth="2" opacity="0.6" />
                        {/* Rivets */}
                        <circle cx="30" cy="38" r="2.5" fill="#94a3b8" />
                        <circle cx="70" cy="38" r="2.5" fill="#94a3b8" />
                        <circle cx="30" cy="62" r="2.5" fill="#94a3b8" />
                        <circle cx="70" cy="62" r="2.5" fill="#94a3b8" />
                    </g>
                );
            case 'copper':
                return (
                    <g>
                        {/* Cooper Coils / Ingot */}
                        <rect x="25" y="30" width="50" height="40" rx="4" fill="url(#gradCopper)" stroke="#9a3412" strokeWidth="3" />
                        {/* Coils wrapped around */}
                        <line x1="33" y1="30" x2="33" y2="70" stroke="#fdba74" strokeWidth="4" />
                        <line x1="45" y1="30" x2="45" y2="70" stroke="#fdba74" strokeWidth="4" />
                        <line x1="57" y1="30" x2="57" y2="70" stroke="#fdba74" strokeWidth="4" />
                        <line x1="67" y1="30" x2="67" y2="70" stroke="#fdba74" strokeWidth="4" />
                    </g>
                );
            case 'lithium':
                return (
                    <g filter="url(#iconGlow)">
                        {/* Glowing Cyan Crystals */}
                        <polygon points="50,15 65,55 50,85 35,55" fill="url(#gradLithium)" stroke="#22d3ee" strokeWidth="2" />
                        <polygon points="35,35 50,65 35,85 20,55" fill="url(#gradLithium)" opacity="0.8" stroke="#22d3ee" strokeWidth="1.5" />
                        <polygon points="65,35 80,55 65,85 50,65" fill="url(#gradLithium)" opacity="0.8" stroke="#22d3ee" strokeWidth="1.5" />
                    </g>
                );
            case 'bananium':
                return (
                    <g filter="url(#iconGlow)">
                        {/* Sci-Fi Glowing Banana Crystal */}
                        <path d="M25 45 Q40 20 65 30 Q75 35 80 45 Q70 50 60 45 Q45 40 30 65 Q22 65 25 45 Z" fill="url(#gradBananium)" stroke="#facc15" strokeWidth="2" />
                        {/* Inner Crystal Core */}
                        <path d="M33 46 Q45 32 60 38 Q50 43 42 45 Q38 48 35 55" fill="none" stroke="#fef08a" strokeWidth="2" opacity="0.7" />
                        {/* Sparkles */}
                        <polygon points="75,20 77,25 82,27 77,29 75,34 73,29 68,27 73,25" fill="#fff" />
                    </g>
                );
            case 'mineral':
                return (
                    <g>
                        {/* Uncut Cluster with Violet Glow */}
                        <polygon points="50,20 70,40 60,80 40,80 30,40" fill="url(#gradMineral)" stroke="#a855f7" strokeWidth="2" />
                        {/* Crystal Facets */}
                        <polygon points="50,20 50,80 70,40" fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.7" />
                        <polygon points="50,20 30,40 50,80" fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.7" />
                        <line x1="30" y1="40" x2="70" y2="40" stroke="#c084fc" strokeWidth="1" opacity="0.5" />
                    </g>
                );
            case 'credits':
                return (
                    <g filter="url(#iconGlow)">
                        {/* Gold Coin */}
                        <circle cx="50" cy="50" r="35" fill="url(#gradCredits)" stroke="#eab308" strokeWidth="3" />
                        {/* Inner Ring */}
                        <circle cx="50" cy="50" r="27" fill="none" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="6,2" />
                        {/* Central Holo C */}
                        <path d="M58 40 Q42 40 42 50 Q42 60 58 60" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
                    </g>
                );
            case 'water':
                return (
                    <g>
                        {/* Water Flask */}
                        <path d="M35 25 H65 V35 L75 60 A25 25 0 0 1 25 60 L35 35 Z" fill="#334155" stroke="#64748b" strokeWidth="3" />
                        {/* Water Fluid Level */}
                        <path d="M28 58 A22 22 0 0 0 72 58 L68 45 H32 Z" fill="url(#gradWater)" />
                        {/* Highlight */}
                        <path d="M37 28 H63" stroke="#94a3b8" strokeWidth="2" />
                    </g>
                );
            case 'food':
                return (
                    <g>
                        {/* Hexagonal Green Food Canister */}
                        <polygon points="50,15 80,30 80,70 50,85 20,70 20,30" fill="url(#gradFood)" stroke="#16a34a" strokeWidth="3" />
                        {/* Leaf/Nutrient Logo */}
                        <path d="M50 30 C35 45 50 70 50 70 C50 70 65 45 50 30 Z" fill="#bbf7d0" opacity="0.8" />
                        <line x1="50" y1="30" x2="50" y2="70" stroke="#15803d" strokeWidth="2" />
                    </g>
                );
            case 'energy':
                return (
                    <g filter="url(#iconGlow)">
                        {/* Capacitor Shell */}
                        <rect x="35" y="15" width="30" height="70" rx="15" fill="none" stroke="#64748b" strokeWidth="3" />
                        {/* Neon Lighting Bolt */}
                        <path d="M53 25 L38 52 H48 L45 75 L62 48 H52 Z" fill="url(#gradEnergy)" stroke="#facc15" strokeWidth="1.5" />
                    </g>
                );
            case 'fuel':
                return (
                    <g>
                        {/* Fuel Canister */}
                        <rect x="25" y="25" width="50" height="55" rx="5" fill="url(#gradFuel)" stroke="#b91c1c" strokeWidth="3" />
                        <rect x="40" y="15" width="20" height="10" fill="#475569" stroke="#1e293b" strokeWidth="2" />
                        {/* Hazard Stripes */}
                        <line x1="30" y1="40" x2="45" y2="55" stroke="#1e293b" strokeWidth="6" />
                        <line x1="45" y1="40" x2="60" y2="55" stroke="#1e293b" strokeWidth="6" />
                        <line x1="55" y1="40" x2="70" y2="55" stroke="#1e293b" strokeWidth="6" />
                        {/* Hazard center overlay */}
                        <rect x="35" y="43" width="30" height="15" fill="#facc15" />
                        <circle cx="50" cy="50" r="4" fill="black" />
                    </g>
                );
            case 'rock':
                return (
                    <g>
                        {/* Jagged Rock Shape */}
                        <polygon points="50,15 80,40 70,80 30,80 20,40" fill="url(#gradRock)" stroke="#475569" strokeWidth="3" />
                        <polygon points="50,15 45,50 30,80" fill="none" stroke="#94a3b8" strokeWidth="1.5" opacity="0.5" />
                        <polygon points="50,15 55,55 70,80" fill="none" stroke="#94a3b8" strokeWidth="1.5" opacity="0.5" />
                    </g>
                );
            case 'soil':
                return (
                    <g>
                        {/* Soft Dirt Heap */}
                        <path d="M15 80 C20 40 40 25 50 25 C60 25 80 40 85 80 Z" fill="url(#gradSoil)" stroke="#451a03" strokeWidth="3" />
                        {/* Dirt particles details */}
                        <circle cx="35" cy="55" r="2" fill="#d97706" opacity="0.6" />
                        <circle cx="65" cy="50" r="2.5" fill="#d97706" opacity="0.6" />
                        <circle cx="50" cy="65" r="2" fill="#d97706" opacity="0.6" />
                    </g>
                );
            default:
                return (
                    <g>
                        {/* Question Mark for unknown/fog */}
                        <circle cx="50" cy="50" r="35" fill="#334155" stroke="#475569" strokeWidth="3" />
                        <text x="50" y="62" fontSize="36" fontWeight="bold" fill="#94a3b8" textAnchor="middle">?</text>
                    </g>
                );
        }
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {renderGradients()}
            {renderContent()}
        </svg>
    );
};
