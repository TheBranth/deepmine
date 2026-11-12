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

  public update(tiles: Record<string, Tile>, delta: number, elapsedSec: number) {
    const activeTileIds = new Set<string>();

    Object.values(tiles).forEach(tile => {
      if (tile.job && tile.assignedCrewIds && tile.assignedCrewIds.length > 0 && !tile.isMined) {
        activeTileIds.add(tile.id);
        let rigGroup = this.activeRigs.get(tile.id);

        const posX = tile.x * 1.15;
        const posY = -tile.y * 1.15;

        if (!rigGroup) {
          rigGroup = this.createRigMesh(tile.y);
          rigGroup.position.set(posX, posY, 0.65);
          this.group.add(rigGroup);
          this.activeRigs.set(tile.id, rigGroup);

          // Laser beam effect for mining cutters
          const beamGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -0.6)
          ]);
          const beamMat = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
          });
          const beam = new THREE.Line(beamGeo, beamMat);
          rigGroup.add(beam);
          this.rigBeams.set(tile.id, beam);
        } else {
          rigGroup.position.set(posX, posY, 0.65);
        }

        // Animate rig vibration and gentle hovering
        const hoverOffset = Math.sin(elapsedSec * 6 + tile.x) * 0.04;
        rigGroup.position.z = 0.65 + hoverOffset;

        // Animate cutter or wheels
        const cutter = rigGroup.getObjectByName('cutter');
        if (cutter) {
          cutter.rotation.z += delta * 8;
        }

        // Pulse mining laser beam
        const beam = this.rigBeams.get(tile.id);
        if (beam) {
          (beam.material as THREE.LineBasicMaterial).opacity = 0.4 + Math.sin(elapsedSec * 15) * 0.4;
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

  private createRigMesh(depth: number): THREE.Group {
    const rigRoot = new THREE.Group();

    // Pick Kenney 3D Model: Rover for shallow depths, Heavy Miner for deep depths
    const modelKey = depth < 4 ? 'rover' : 'miner';
    const cloned = modelManager.cloneModel(modelKey);

    if (cloned) {
      if (modelKey === 'rover') {
        cloned.scale.set(0.9, 0.9, 0.9);
        cloned.rotation.x = Math.PI / 3;
        cloned.rotation.y = Math.PI / 6;
      } else {
        cloned.scale.set(0.35, 0.35, 0.35);
        cloned.rotation.x = Math.PI / 3;
        cloned.rotation.y = -Math.PI / 8;
      }
      rigRoot.add(cloned);
    } else {
      // Fallback procedural drill
      const bodyGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.6, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI / 2;
      rigRoot.add(body);

      const coneGeo = new THREE.ConeGeometry(0.25, 0.45, 8);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.name = 'cutter';
      cone.position.set(0, 0, 0.35);
      cone.rotation.x = Math.PI / 2;
      rigRoot.add(cone);
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
