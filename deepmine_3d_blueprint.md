# DEEPMINE 3D TRANSFORMATION BLUEPRINT & HANDOFF INSTRUCTIONS

> [!NOTE]
> **Instructions for the AI Assistant**: Read this file to seamlessly adopt the architectural learnings of *Perilous Ways* and apply them to *Deepmine*.

---

## 1. Project Goal & Executive Context

- **Target Project**: *Deepmine* (`React` + `TypeScript` + `Vite` + `Tailwind CSS`).
- **Inspiration & Architecture Reference**: *Perilous Ways* (3D Three.js world simulator with A* terrain pathfinding, physical logistics, instanced terrain/props, procedural sound, and headless Node.js balance testing).
- **Core Mission**: Transform Deepmine's 2D grid (`TileGrid.tsx`) into a high-impact **3D Subterranean Cutaway Diorama Canvas** using Three.js embedded seamlessly within the existing React + TS architecture.

---

## 2. Dependencies & Prerequisites

Run these commands inside `deepmine/` directory:

```bash
# Install Three.js and types
npm install three @types/three

# If PowerShell script execution policy prevents direct npm execution:
cmd /c npm install three @types/three

# If running behind strict proxy/SSL, install with skip download for puppeteer if needed:
cmd /c "set PUPPETEER_SKIP_DOWNLOAD=true && npm install three @types/three"
```

---

## 3. Core Architecture & Module Breakdown

### 3.1 Directory Structure to Add in `deepmine/src/`

```
src/
├── gfx/                         # 3D Graphics Subsystem (inspired by Perilous Ways)
│   ├── SubterraneanCanvas.tsx   # React Wrapper & Canvas Mount Component
│   ├── scene.ts                 # Three.js Scene, Camera, Lighting & Controls
│   ├── strata.ts                # Volumetric Rock/Tile Voxel Meshes & Geometries
│   ├── materials.ts             # Shaders, Mineral Glow, Fog-of-War Materials
│   ├── rig.ts                   # 3D Mining Rig & Cutter Head Parametric Meshes
│   ├── logistics.ts             # Elevators, Support Beams, Moving Resource Hoists
│   └── raycaster.ts             # 3D Tile Click/Hover Raycasting & Interaction
└── tools/                       # Headless Sim & Balance Testing (Root level or in deepmine)
    └── balance.mjs              # Headless Node.js AI playtest script
```

---

## 4. Key Code Snippets & Implementation-Ready Modules

### Module A: `src/gfx/materials.ts` (Dynamic Mineral Glow & Fog-of-War)

```typescript
import * as THREE from 'three';

export const StrataMaterials = {
  soil: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 }),
  granite: new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.7 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x704214, metalness: 0.5, roughness: 0.5 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.6, roughness: 0.4 }),
  lithium: new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00aaff,
    emissiveIntensity: 0.6,
    roughness: 0.2
  }),
  bananium: new THREE.MeshStandardMaterial({
    color: 0x9900ff,
    emissive: 0xd400ff,
    emissiveIntensity: 0.8,
    roughness: 0.1
  }),
  core: new THREE.MeshStandardMaterial({
    color: 0xff3300,
    emissive: 0xff5500,
    emissiveIntensity: 1.2,
  }),
  fogOfWar: new THREE.MeshStandardMaterial({
    color: 0x0a0a10,
    roughness: 1.0,
    transparent: true,
    opacity: 0.95
  })
};
```

---

### Module B: `src/gfx/SubterraneanCanvas.tsx` (React Engine Bridge)

```tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';
import { StrataMaterials } from './materials';

export const SubterraneanCanvas: React.FC<{ onSelectTile: (tileId: string) => void }> = ({ onSelectTile }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { gameState } = useGame();

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0c0d12);
        scene.fog = new THREE.FogExp2(0x0c0d12, 0.015);

        // 2. Camera Setup (Low FOV perspective for Diorama look)
        const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        camera.position.set(0, -5, 30); // Center on subterranean cutaway

        // 3. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
        sunLight.position.set(10, 20, 15);
        scene.add(sunLight);

        // 4. Renderer Setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // 5. Build Voxels/Tiles
        const tileGroup = new THREE.Group();
        scene.add(tileGroup);

        const boxGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);

        Object.values(gameState.tiles).forEach(tile => {
            const mat = !tile.isVisible 
                ? StrataMaterials.fogOfWar 
                : (StrataMaterials[tile.type as keyof typeof StrataMaterials] || StrataMaterials.rock);
            
            const mesh = new THREE.Mesh(boxGeo, mat);
            // Convert X,Y grid (Y is depth down) to 3D space:
            mesh.position.set(tile.x * 1.0, -tile.y * 1.0, 0);
            mesh.userData = { tileId: tile.id };
            tileGroup.add(mesh);
        });

        // 6. Raycasting Interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleClick = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(tileGroup.children);

            if (intersects.length > 0) {
                const clickedTileId = intersects[0].object.userData.tileId;
                if (clickedTileId) onSelectTile(clickedTileId);
            }
        };

        renderer.domElement.addEventListener('pointerdown', handleClick);

        // 7. Animation Loop
        let animId: number;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        // 8. Cleanup
        return () => {
            cancelAnimationFrame(animId);
            renderer.domElement.removeEventListener('pointerdown', handleClick);
            renderer.dispose();
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, [gameState.tiles]);

    return <div ref={containerRef} className="w-full h-full min-h-[600px] relative cursor-pointer" />;
};
```

---

## 5. Step-by-Step Action Plan

1. **Install Dependencies**: Run `npm install three @types/three` inside `deepmine/`.
2. **Implement `SubterraneanCanvas.tsx`**: Add `src/gfx/materials.ts` and `src/gfx/SubterraneanCanvas.tsx`.
3. **Connect Canvas to `TileGrid.tsx`**: Add a View Toggle (2D Grid / 3D Diorama) in `deepmine/src/components/TileGrid.tsx`.
4. **Physical Logistics Animation**: Animate moving elevator hoists for active `TransportTask` items along the depth axis.
5. **Headless Sim Tool**: Add `tools/balance.mjs` in Node.js to balance tile health, digging speed, and market resources.

---

## 6. Prompt to Give the Agent in the Next Thread

> "Hey! I am sharing the Deepmine 3D Transformation Blueprint (`deepmine_3d_blueprint.md`). We are building a 3D Subterranean Cutaway Diorama Canvas in Three.js for Deepmine, applying the design principles and architecture of *Perilous Ways*. Please inspect the blueprint file and let's start implementing Phase 1 (`SubterraneanCanvas.tsx` and 3D tile rendering)!"
