import * as THREE from 'three';

export const StrataMaterials: Record<string, THREE.Material> = {
  soil: new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.9,
    metalness: 0.1,
  }),
  rock: new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.8,
    metalness: 0.2,
  }),
  granite: new THREE.MeshStandardMaterial({
    color: 0x2d2d2d,
    roughness: 0.7,
    metalness: 0.3,
  }),
  iron: new THREE.MeshStandardMaterial({
    color: 0x704214,
    metalness: 0.7,
    roughness: 0.4,
  }),
  copper: new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.8,
    roughness: 0.3,
  }),
  lithium: new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00aaff,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  }),
  bananium: new THREE.MeshStandardMaterial({
    color: 0xeab308,
    emissive: 0xfacc15,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  }),
  mineral: new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0xc084fc,
    emissiveIntensity: 0.7,
    roughness: 0.2,
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
    opacity: 0.92,
  }),
  relay: new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.5,
  }),
  service: new THREE.MeshStandardMaterial({
    color: 0x4f46e5,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x4338ca,
    emissiveIntensity: 0.5,
  }),
  selectedHighlight: new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
  }),
  claimedProspectMe: new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.2,
  }),
  claimedMineMe: new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.2,
  }),
  claimedOther: new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.2,
  }),
};
