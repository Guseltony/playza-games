// Environment Manager - Handles biome switching and environment visuals
import * as THREE from 'three';

export class EnvironmentManager {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        this.currentBiome = 'road';
        this.transitionProgress = 1;
        this.floorMeshes = [];
        this.decorations = [];
        
        this.biomes = {
            railway: {
                color: 0x4a4a4a,
                fog: 0x2a2a2a,
                ambient: 0x666666,
                directional: 0xaaaaaa
            },
            road: {
                color: 0x87ceeb,
                fog: 0x87ceeb,
                ambient: 0xffffff,
                directional: 0xffffff
            },
            bridge: {
                color: 0xff7f50,
                fog: 0xff9966,
                ambient: 0xffcc99,
                directional: 0xffaa66
            },
            air: {
                color: 0x00bfff,
                fog: 0x87ceeb,
                ambient: 0xffffff,
                directional: 0x87ceff
            },
            snow: {
                color: 0xe0efff,
                fog: 0xd0e8ff,
                ambient: 0xccddff,
                directional: 0xffffff
            }
        };
        
        this.createFloor();
    }
    
    createFloor() {
        for (let i = 0; i < 20; i++) {
            const segment = this.createFloorSegment(i * 10, this.currentBiome);
            this.scene.add(segment);
            this.floorMeshes.push(segment);
        }
    }
    
    createFloorSegment(z, biome) {
        const group = new THREE.Group();
        
        const floorGeo = new THREE.PlaneGeometry(15, 10);
        const colors = this.biomes[biome] || this.biomes.road;
        const floorMat = new THREE.MeshStandardMaterial({
            color: colors.color,
            roughness: 0.8,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, -0.01, z);
        floor.receiveShadow = true;
        group.add(floor);
        
        for (let lane = 0; lane < 3; lane++) {
            const laneGeo = new THREE.PlaneGeometry(0.1, 10);
            const laneMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.5
            });
            const laneLine = new THREE.Mesh(laneGeo, laneMat);
            laneLine.rotation.x = -Math.PI / 2;
            laneLine.position.set((lane - 1) * 3, 0.01, z);
            group.add(laneLine);
        }
        
        group.userData.z = z;
        group.userData.biome = biome;
        
        return group;
    }
    
    update(dt) {
        const playerZ = this.engine.player.player.position.z;
        
        this.floorMeshes.forEach((segment, index) => {
            const relativeZ = segment.userData.z - playerZ;
            
            if (relativeZ < -60) {
                const newZ = segment.userData.z + 200;
                segment.userData.z = newZ;
                segment.userData.biome = this.currentBiome;
                
                segment.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                segment.clear();
                
                const newSegment = this.createFloorSegment(newZ, this.currentBiome);
                segment.position.z = newZ;
                
                segment.children.forEach((child, i) => {
                    if (newSegment.children[i]) {
                        child.geometry = newSegment.children[i].geometry;
                        child.material = newSegment.children[i].material;
                    }
                });
            }
        });
        
        this.updateBiomeColors(dt);
    }
    
    updateBiomeColors(dt) {
        if (this.transitionProgress < 1) {
            this.transitionProgress += dt * 0.5;
            
            const fromBiome = this.biomes[this.currentBiome];
            const toBiome = this.biomes[this.currentBiome];
            
            const t = this.easeInOutCubic(this.transitionProgress);
            
            this.scene.background.lerpColors(
                new THREE.Color(fromBiome.fog),
                new THREE.Color(toBiome.fog),
                t
            );
            
            this.scene.fog.color.lerpColors(
                new THREE.Color(fromBiome.fog),
                new THREE.Color(toBiome.fog),
                t
            );
            
            if (this.transitionProgress >= 1) {
                this.transitionProgress = 1;
            }
        }
    }
    
    setBiome(biome) {
        if (this.currentBiome !== biome) {
            this.currentBiome = biome;
            this.transitionProgress = 0;
            
            const colors = this.biomes[biome];
            this.scene.background = new THREE.Color(colors.fog);
            this.scene.fog.color = new THREE.Color(colors.fog);
        }
    }
    
    transitionTo(biome) {
        this.currentBiome = biome;
        this.transitionProgress = 0;
        
        const colors = this.biomes[biome];
        
        this.engine.effects.addTransition(biome);
        this.engine.cameraSystem.triggerTransition();
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    reset() {
        this.currentBiome = 'road';
        this.transitionProgress = 1;
    }
}
