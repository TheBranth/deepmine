import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const MODEL_PATHS = {
  base: '/models/space/hangar_roundGlass.glb',
  relay: '/models/space/satelliteDish_detailed.glb',
  scanner: '/models/space/machine_wireless.glb',
  command: '/models/space/hangar_smallA.glb',
  drone: '/models/space/machine_generatorLarge.glb',
  wormhole: '/models/space/pipe_ringHigh.glb',
  miner: '/models/space/craft_miner.glb',
  rover: '/models/space/rover.glb',
  cargo: '/models/space/craft_cargoA.glb',
  cargoAlt: '/models/space/craft_cargoB.glb',
  barrel: '/models/space/barrel.glb',
  supports: '/models/space/supports_high.glb',
  crystals: '/models/space/rock_crystalsLargeA.glb',
  astronaut: '/models/space/astronautA.glb',
} as const;

export type ModelKey = keyof typeof MODEL_PATHS;

class ModelManager {
  private loader: GLTFLoader;
  private cache: Map<string, THREE.Group> = new Map();
  private loadPromises: Map<string, Promise<THREE.Group>> = new Map();
  private isPreloaded = false;

  constructor() {
    this.loader = new GLTFLoader();
  }

  public async preloadAll(): Promise<void> {
    if (this.isPreloaded) return;
    const keys = Object.keys(MODEL_PATHS) as ModelKey[];
    await Promise.all(keys.map(key => this.loadModel(key)));
    this.isPreloaded = true;
  }

  public async loadModel(key: ModelKey): Promise<THREE.Group> {
    const url = MODEL_PATHS[key];
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key)!;
    }

    const promise = new Promise<THREE.Group>((resolve) => {
      this.loader.load(
        url,
        (gltf) => {
          const root = gltf.scene;
          // Enable shadow casting and receiving for all meshes in the model
          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Automatically center model geometry at (0, 0, 0)
          const box = new THREE.Box3().setFromObject(root);
          const center = new THREE.Vector3();
          box.getCenter(center);
          root.position.sub(center);

          const centeredGroup = new THREE.Group();
          centeredGroup.add(root);

          this.cache.set(key, centeredGroup);
          resolve(centeredGroup);
        },
        undefined,
        (error) => {
          console.warn(`[ModelManager] Failed to load model "${key}" from ${url}:`, error);
          // Create fallback placeholder group
          const fallback = new THREE.Group();
          this.cache.set(key, fallback);
          resolve(fallback);
        }
      );
    });

    this.loadPromises.set(key, promise);
    return promise;
  }

  public cloneModel(key: ModelKey): THREE.Group | null {
    const template = this.cache.get(key);
    if (!template) return null;
    return template.clone(true);
  }

  public hasModel(key: ModelKey): boolean {
    return this.cache.has(key);
  }
}

export const modelManager = new ModelManager();
