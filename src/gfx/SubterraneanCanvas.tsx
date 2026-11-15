import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { createSubterraneanScene } from './scene';
import { StrataManager } from './strata';
import { RigManager } from './rig';
import { LogisticsManager } from './logistics';
import { SubterraneanRaycaster } from './raycaster';
import { modelManager } from './models';

interface SubterraneanCanvasProps {
  onSelectTile: (tileId: string) => void;
  selectedTileId: string | null;
}

export const SubterraneanCanvas: React.FC<SubterraneanCanvasProps> = ({ onSelectTile, selectedTileId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gameState } = useGame();

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize Scene & Engine Context
    const sceneCtx = createSubterraneanScene(containerRef.current);
    const strataMgr = new StrataManager(sceneCtx.scene);
    const rigMgr = new RigManager(sceneCtx.scene);
    const logisticsMgr = new LogisticsManager(sceneCtx.scene);
    const raycaster = new SubterraneanRaycaster();

    // 2. Click Handler with drag threshold
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPos = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const dist = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
      if (dist < 6 && event.button === 0) {
        const tileId = raycaster.getIntersectedTileId(
          event,
          containerRef.current,
          sceneCtx.camera,
          strataMgr.getTileGroup()
        );
        if (tileId) {
          onSelectTile(tileId);
        }
      }
    };

    const domElement = sceneCtx.renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);

    // 3. Preload 3D Models & Update Scene
    let isMounted = true;
    modelManager.preloadAll().then(() => {
      if (isMounted) {
        strataMgr.updateTiles(gameState.tiles, selectedTileId, gameState.baseLocation, gameState.currentUser);
      }
    });

    // 4. Animation Loop
    let animId: number;
    let lastTime = performance.now();
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      const elapsedSec = (now - startTime) / 1000;
      lastTime = now;

      // Update Subsystems
      strataMgr.animate(delta);
      rigMgr.update(gameState.tiles, delta, elapsedSec);
      logisticsMgr.update(
        gameState.tiles,
        gameState.transportQueue,
        gameState.currentUser,
        gameState.baseLocation,
        elapsedSec
      );

      sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.camera);
    };

    animate();

    // Initial tile placement
    strataMgr.updateTiles(gameState.tiles, selectedTileId, gameState.baseLocation, gameState.currentUser);

    // 5. Cleanup
    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);
      strataMgr.cleanup();
      rigMgr.cleanup();
      logisticsMgr.cleanup();
      sceneCtx.cleanup();
    };
  }, [gameState.tiles, gameState.transportQueue, selectedTileId, gameState.baseLocation, gameState.currentUser, onSelectTile]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[600px] relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 shadow-2xl bg-[#0c0d12]"
    >
      <div className="absolute bottom-3 left-4 z-10 pointer-events-none text-xs text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700/60 backdrop-blur-sm">
        Left Click: Select &bull; Right Click/Drag: Pan &bull; Wheel: Zoom
      </div>
    </div>
  );
};
