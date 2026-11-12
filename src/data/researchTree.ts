export interface ResearchNode {
    id: string;
    name: string;
    description: string;
    cost: {
        minerals: number;
        bananium: number;
    };
    requirements: string[];
    effect: {
        type: 'mining_speed' | 'process_speed' | 'base_upgrade' | 'visibility' | 'inventory' | 'move_speed' | 'unlock_resource' | 'logistics';
        value: number;
        resource?: string; // For unlock_resource
    };
    icon?: string;
    tier: number;
    position: { x: number, y: number }; // For UI rendering
}

export const RESEARCH_TREE: ResearchNode[] = [
    // --- TIER 1 ---
    {
        id: 'basic_logistics',
        name: 'Basic Logistics',
        description: 'Improve organization to mine dirt faster.',
        cost: { minerals: 50, bananium: 0 },
        requirements: [],
        effect: { type: 'mining_speed', value: 0.2 },
        tier: 1,
        position: { x: 300, y: 100 }
    },
    {
        id: 'improvised_containers',
        name: 'Improvised Containers',
        description: 'Increase crew inventory capacity.',
        cost: { minerals: 75, bananium: 0 },
        requirements: [],
        effect: { type: 'inventory', value: 5 },
        tier: 1,
        position: { x: 100, y: 100 }
    },
    {
        id: 'scouting_drones',
        name: 'Scouting Drones',
        description: 'Increase visibility range around the base.',
        cost: { minerals: 100, bananium: 0 },
        requirements: [],
        effect: { type: 'visibility', value: 1 },
        tier: 1,
        position: { x: 500, y: 100 }
    },
    {
        id: 'logistics_1',
        name: 'High-Speed Conveyors',
        description: 'Transport resources 50% faster.',
        cost: { minerals: 150, bananium: 0 },
        requirements: ['basic_logistics'],
        effect: { type: 'logistics', value: 0.5 },
        tier: 1,
        position: { x: 700, y: 100 }
    },

    // --- TIER 2 ---
    {
        id: 'hardened_drills',
        name: 'Hardened Drill Bits',
        description: 'Allows efficient mining of Rock.',
        cost: { minerals: 200, bananium: 0 },
        requirements: ['basic_logistics'],
        effect: { type: 'mining_speed', value: 0.3 }, // Further speed bump
        tier: 2,
        position: { x: 300, y: 250 }
    },
    {
        id: 'mineral_processing',
        name: 'Mineral Processing',
        description: 'Unlock ability to upgrade base to Level 2 (Store more).',
        cost: { minerals: 300, bananium: 0 },
        requirements: ['basic_logistics'],
        effect: { type: 'base_upgrade', value: 2 },
        tier: 2,
        position: { x: 400, y: 350 }
    },
    {
        id: 'team_coordination',
        name: 'Team Coordination',
        description: 'Crew moves 10% faster.',
        cost: { minerals: 150, bananium: 0 },
        requirements: ['improvised_containers'],
        effect: { type: 'move_speed', value: 0.1 },
        tier: 2,
        position: { x: 100, y: 250 }
    },

    // --- TIER 3 ---
    {
        id: 'bananium_enrichment',
        name: 'Bananium Enrichment',
        description: 'Unlock Level 3 Base (Smelter).',
        cost: { minerals: 1000, bananium: 100 },
        requirements: ['mineral_processing'],
        effect: { type: 'base_upgrade', value: 3 },
        tier: 3,
        position: { x: 400, y: 500 }
    },
    {
        id: 'heavy_machinery',
        name: 'Heavy Machinery',
        description: 'Massive mining speed boost, but heavy.',
        cost: { minerals: 800, bananium: 50 },
        requirements: ['hardened_drills'],
        effect: { type: 'mining_speed', value: 0.5 },
        tier: 3,
        position: { x: 250, y: 500 }
    },
    {
        id: 'deep_scanners',
        name: 'Deep Scanners',
        description: 'Reveal deep blocks.',
        cost: { minerals: 600, bananium: 20 },
        requirements: ['scouting_drones'],
        effect: { type: 'visibility', value: 1 }, // Adds another 1 radius
        tier: 3,
        position: { x: 550, y: 400 }
    }
];
