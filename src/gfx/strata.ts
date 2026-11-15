import * as THREE from 'three';
import type { Tile } from '../types';
import { StrataMaterials } from './materials';
import { modelManager, type ModelKey } from './models';

export class StrataManager {
  private group: THREE.Group;
  private tileMeshes: Map<string, THREE.Mesh> = new Map();
  private propMeshes: Map<string, THREE.Group> = new Map();
  private selectionMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Create selection outline box
    const selectGeo = new THREE.BoxGeometry(1.08, 1.08, 1.08);
    this.selectionMesh = new THREE.Mesh(selectGeo, StrataMaterials.selectedHighlight);
    this.selectionMesh.visible = false;
    scene.add(this.selectionMesh);
  }

  public updateTiles(
    tiles: Record<string, Tile>,
    selectedTileId: string | null,
    baseLocation: string | null,
    currentUser: string | null = null
  ) {
    const tileList = Object.values(tiles);
    const activeTileIds = new Set(tileList.map(t => t.id));

    tileList.forEach(tile => {
      let mesh = this.tileMeshes.get(tile.id);
      const posX = tile.x * 1.15;
      const posY = -tile.y * 1.15;
      const posZ = 0;

      const isBase = tile.id === baseLocation || tile.building?.type === 'base';
      const isClaimedOrActive = (tile.isClaimed && Boolean(tile.claimedBy)) || Boolean(tile.job);
      const isMineByMe = Boolean(currentUser && tile.claimedBy === currentUser);

      // Select material
      let mat: THREE.Material;
      if (!tile.isVisible && !tile.isMined) {
        mat = StrataMaterials.fogOfWar;
      } else if (tile.structure === 'relay') {
        mat = StrataMaterials.relay;
      } else if (tile.structure === 'scanner') {
        mat = StrataMaterials.scanner;
      } else if (tile.structure === 'command') {
        mat = StrataMaterials.command;
      } else if (tile.structure === 'drone') {
        mat = StrataMaterials.drone;
      } else if (tile.structure === 'wormhole') {
        mat = StrataMaterials.wormhole;
      } else if (!isBase && !tile.isMined && isClaimedOrActive) {
        if (!isMineByMe) {
          mat = StrataMaterials.claimedOther;
        } else if (tile.job === 'prospect') {
          mat = StrataMaterials.claimedProspectMe;
        } else {
          mat = StrataMaterials.claimedMineMe;
        }
      } else if (StrataMaterials[tile.type]) {
        mat = StrataMaterials[tile.type];
      } else {
        mat = StrataMaterials.soil;
      }

      if (!mesh) {
        const geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(posX, posY, posZ);
        mesh.userData = { tileId: tile.id };
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);
        this.tileMeshes.set(tile.id, mesh);
      } else {
        mesh.material = mat;
        mesh.position.set(posX, posY, posZ);
      }

      // Check if this tile should host a 3D Kenney space asset prop
      let propKey: ModelKey | null = null;
      let propScale = 1.0;
      let propZOffset = 0.0;

      if (isBase) {
        propKey = 'base';
        propScale = 0.38;
        propZOffset = 0.0;
        mesh.visible = false; // Replace cube with base entirely
      } else {
        mesh.visible = true;
        if (tile.structure === 'relay') {
          propKey = 'relay';
          propScale = 0.85;
          propZOffset = 0.1;
        } else if (tile.structure === 'scanner') {
          propKey = 'scanner';
          propScale = 0.75;
          propZOffset = 0.1;
        } else if (tile.structure === 'command') {
          propKey = 'command';
          propScale = 0.45;
          propZOffset = 0.05;
        } else if (tile.structure === 'drone') {
          propKey = 'drone';
          propScale = 0.75;
          propZOffset = 0.1;
        } else if (tile.structure === 'wormhole') {
          propKey = 'wormhole';
          propScale = 0.72;
          propZOffset = 0.15;
        } else if (tile.isMined && !tile.structure) {
          // Structural support beams in excavated tunnels
          propKey = 'supports';
          propScale = 0.88;
          propZOffset = 0.0;
        } else if (tile.isVisible && !tile.isMined && (tile.type === 'lithium' || tile.type === 'bananium' || tile.type === 'mineral')) {
          // Glowing ore crystals protruding from raw mineral veins
          propKey = 'crystals';
          propScale = 0.65;
          propZOffset = 0.1;
        }
      }

      // Manage prop instance
      const existingProp = this.propMeshes.get(tile.id);
      const propIdTag = propKey ? `${propKey}` : null;

      if (propKey) {
        if (!existingProp || existingProp.userData.propKey !== propIdTag) {
          if (existingProp) {
            this.group.remove(existingProp);
            this.propMeshes.delete(tile.id);
          }
          const cloned = modelManager.cloneModel(propKey);
          if (cloned) {
            cloned.scale.set(propScale, propScale, propScale);
            cloned.position.set(posX, posY, propZOffset);
            cloned.userData = { tileId: tile.id, propKey: propIdTag };
            cloned.traverse((child) => {
              child.userData = { tileId: tile.id };
            });
            // Rotate models for natural isometric perspective
            if (isBase || propKey === 'command') {
              cloned.rotation.x = Math.PI / 2.2;
            } else if (propKey === 'relay' || propKey === 'scanner' || propKey === 'drone' || propKey === 'wormhole' || propKey === 'crystals') {
              cloned.rotation.x = Math.PI / 2.5;
            } else if (propKey === 'supports') {
              cloned.rotation.x = Math.PI / 2;
            }
            this.group.add(cloned);
            this.propMeshes.set(tile.id, cloned);
          }
        } else {
          existingProp.position.set(posX, posY, propZOffset);
        }
      } else if (existingProp) {
        this.group.remove(existingProp);
        this.propMeshes.delete(tile.id);
      }

      // Voxel depth scaling
      if (tile.isMined && !isBase) {
        mesh.scale.set(0.9, 0.9, 0.2);
        mesh.position.z = -0.4;
      } else {
        mesh.scale.set(1.0, 1.0, 1.0);
      }
    });

    // Cleanup abandoned props
    this.propMeshes.forEach((prop, id) => {
      if (!activeTileIds.has(id)) {
        this.group.remove(prop);
        this.propMeshes.delete(id);
      }
    });

    // Update selection mesh position
    if (selectedTileId && tiles[selectedTileId]) {
      const t = tiles[selectedTileId];
      if (this.selectionMesh) {
        this.selectionMesh.position.set(t.x * 1.15, -t.y * 1.15, 0);
        this.selectionMesh.visible = true;
      }
    } else if (this.selectionMesh) {
      this.selectionMesh.visible = false;
    }
  }

  public animate(delta: number) {
    // Gentle rotation of relay dishes, scanner radar, and wormhole rings
    this.propMeshes.forEach((prop) => {
      if (prop.userData.propKey === 'relay' || prop.userData.propKey === 'scanner') {
        prop.rotation.z += delta * 0.8;
      } else if (prop.userData.propKey === 'wormhole') {
        prop.rotation.z -= delta * 1.4;
      }
    });
  }

  public getTileGroup(): THREE.Group {
    return this.group;
  }

  public cleanup() {
    this.tileMeshes.forEach(mesh => {
      mesh.geometry.dispose();
    });
    this.tileMeshes.clear();
    this.propMeshes.clear();
    this.group.clear();
  }
}
