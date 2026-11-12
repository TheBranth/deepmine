import * as THREE from 'three';
import type { Tile } from '../types';
import { modelManager } from './models';

export class RigManager {
  private group: THREE.Group;
  private activeRigs: Map<string, THREE.Group> = new Map();
  private rigBeams: Map<string, THREE.Group> = new Map();

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
        const baseZ = 0.95; // Hover clearly in front of the cube face (cube ends at z=0.50)

        if (!rigGroup) {
          rigGroup = this.createRigMesh(tile.y, tile.job);
          rigGroup.position.set(posX, posY + 0.1, baseZ);
          this.group.add(rigGroup);
          this.activeRigs.set(tile.id, rigGroup);

          const isSurvey = tile.job === 'prospect';
          const beamGroup = new THREE.Group();

          if (isSurvey) {
            // 4-corner pyramid scan beam for surveying
            const beamMat = new THREE.LineBasicMaterial({
              color: 0x38bdf8,
              linewidth: 2,
              transparent: true,
              opacity: 0.7
            });
            const corners = [
              new THREE.Vector3(-0.35, -0.45, -0.45),
              new THREE.Vector3(0.35, -0.45, -0.45),
              new THREE.Vector3(0.35, 0.25, -0.45),
              new THREE.Vector3(-0.35, 0.25, -0.45),
            ];
            corners.forEach(corner => {
              const geo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                corner
              ]);
              beamGroup.add(new THREE.Line(geo, beamMat));
            });
          } else {
            // Intense red cutting laser for excavation
            const beamMat = new THREE.LineBasicMaterial({
              color: 0xef4444,
              linewidth: 3,
              transparent: true,
              opacity: 0.9
            });
            const geo = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(0, -0.1, -0.45)
            ]);
            beamGroup.add(new THREE.Line(geo, beamMat));
          }

          rigGroup.add(beamGroup);
          this.rigBeams.set(tile.id, beamGroup);
        }

        // Animate smooth hovering bobbing
        const hoverZ = Math.sin(elapsedSec * 4 + tile.x) * 0.05;
        const hoverY = Math.cos(elapsedSec * 3 + tile.x) * 0.02;
        rigGroup.position.set(posX, (posY + 0.1) + hoverY, baseZ + hoverZ);

        // Pulse scan/laser opacity
        const beamGroup = this.rigBeams.get(tile.id);
        if (beamGroup) {
          const pulse = 0.4 + Math.sin(elapsedSec * 10) * 0.4;
          beamGroup.children.forEach(child => {
            if (child instanceof THREE.Line) {
              (child.material as THREE.LineBasicMaterial).opacity = pulse;
            }
          });
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

    // Rover for surveying, Heavy Miner for deep excavation
    const modelKey = job === 'prospect' ? 'rover' : (depth < 4 ? 'rover' : 'miner');
    const cloned = modelManager.cloneModel(modelKey);

    if (cloned) {
      if (modelKey === 'rover') {
        cloned.scale.set(0.9, 0.9, 0.9);
        // Tilt slightly towards camera to showcase the vehicle
        cloned.rotation.x = Math.PI / 2.3;
      } else {
        cloned.scale.set(0.38, 0.38, 0.38);
        cloned.rotation.x = Math.PI / 2.3;
      }
      rigRoot.add(cloned);
    } else {
      // Fallback procedural mesh
      const bodyGeo = new THREE.BoxGeometry(0.4, 0.3, 0.3);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: job === 'prospect' ? 0x0284c7 : 0xe11d48,
        metalness: 0.8
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
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
