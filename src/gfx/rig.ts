import * as THREE from 'three';
import type { Tile } from '../types';
import { modelManager } from './models';

export class RigManager {
  private group: THREE.Group;
  private activeRigs: Map<string, THREE.Group> = new Map();
  private rigBeams: Map<string, THREE.Line> = new Map();

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  public update(tiles: Record<string, Tile>, _delta: number, elapsedSec: number) {
    const activeTileIds = new Set<string>();

    Object.values(tiles).forEach(tile => {
      if (tile.job && tile.assignedCrewIds && tile.assignedCrewIds.length > 0 && !tile.isMined) {
        activeTileIds.add(tile.id);
        let rigGroup = this.activeRigs.get(tile.id);

        const posX = tile.x * 1.15;
        const posY = -tile.y * 1.15;

        if (!rigGroup) {
          rigGroup = this.createRigMesh(tile.y, tile.job);
          rigGroup.position.set(posX, posY, 0.55);
          this.group.add(rigGroup);
          this.activeRigs.set(tile.id, rigGroup);

          // Scanner/Cutter beam effect
          const beamGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -0.55)
          ]);
          const isSurvey = tile.job === 'prospect';
          const beamMat = new THREE.LineBasicMaterial({
            color: isSurvey ? 0x38bdf8 : 0xef4444,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
          });
          const beam = new THREE.Line(beamGeo, beamMat);
          rigGroup.add(beam);
          this.rigBeams.set(tile.id, beam);
        } else {
          rigGroup.position.set(posX, posY, 0.55);
        }

        // Animate rig vibration and gentle hovering
        const hoverOffset = Math.sin(elapsedSec * 6 + tile.x) * 0.03;
        rigGroup.position.z = 0.55 + hoverOffset;

        // Pulse scanner or laser beam
        const beam = this.rigBeams.get(tile.id);
        if (beam) {
          (beam.material as THREE.LineBasicMaterial).opacity = 0.3 + Math.sin(elapsedSec * 12) * 0.4;
        }
      }
    });

    // Clean up finished rigs
    this.activeRigs.forEach((rig, id) => {
      if (!activeTileIds.has(id)) {
        this.group.remove(rig);
        this.activeRigs.delete(id);
        this.rigBeams.delete(id);
      }
    });
  }

  private createRigMesh(depth: number, job: 'prospect' | 'mine'): THREE.Group {
    const rigRoot = new THREE.Group();

    // Rover for surveying or shallow depths, Heavy Miner for deep excavation
    const modelKey = job === 'prospect' ? 'rover' : (depth < 4 ? 'rover' : 'miner');
    const cloned = modelManager.cloneModel(modelKey);

    if (cloned) {
      if (modelKey === 'rover') {
        cloned.scale.set(0.85, 0.85, 0.85);
        cloned.rotation.x = Math.PI / 2.3;
      } else {
        cloned.scale.set(0.35, 0.35, 0.35);
        cloned.rotation.x = Math.PI / 2.3;
      }
      rigRoot.add(cloned);
    } else {
      // Fallback procedural mesh
      const bodyGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.6, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: job === 'prospect' ? 0x0284c7 : 0xe11d48, metalness: 0.8 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI / 2;
      rigRoot.add(body);
    }

    return rigRoot;
  }

  public cleanup() {
    this.activeRigs.forEach(rig => {
      this.group.remove(rig);
    });
    this.activeRigs.clear();
    this.rigBeams.clear();
    this.group.clear();
  }
}
