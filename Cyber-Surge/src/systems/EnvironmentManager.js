import * as THREE from 'three';

export class EnvironmentManager {
            constructor(engine) {
                this.engine = engine;
                this.scene = engine.scene;
                this.currentBiome = 'road';
                this.transitionProgress = 1;
                this.floorMeshes = [];
                
                this.biomes = {
                    railway: { color: 0x5a5a5a, fog: 0x4a4a4a },
                    road: { color: 0x87ceeb, fog: 0x87ceeb },
                    bridge: { color: 0xffa07a, fog: 0xffa07a },
                    air: { color: 0x87ceeb, fog: 0xe0ffff },
                    snow: { color: 0xffffff, fog: 0xe0f7ff }
                };
                
                this.createFloor();
            }
            
            createFloor() {
                for (let i = 0; i < 40; i++) {
                    const segment = this.createFloorSegment(-i * 10);
                    this.scene.add(segment);
                    this.floorMeshes.push(segment);
                }
            }
            
            createFloorSegment(z) {
                const group = new THREE.Group();
                
                // Track Base: Ancient stone look
                const baseGeo = new THREE.BoxGeometry(10, 2, 10);
                const baseMat = new THREE.MeshStandardMaterial({ color: 0x3d352b, roughness: 0.9, metalness: 0.0 });
                const base = new THREE.Mesh(baseGeo, baseMat);
                base.position.set(0, -1, 0);
                base.receiveShadow = true;
                group.add(base);
                
                // Floor: Tiled stone path (Temple Run style)
                const floorGeo = new THREE.PlaneGeometry(9.6, 10);
                const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a4136, roughness: 1.0 });
                const floor = new THREE.Mesh(floorGeo, floorMat);
                floor.rotation.x = -Math.PI / 2;
                floor.position.set(0, 0.01, 0);
                floor.receiveShadow = true;
                group.add(floor);
                
                // Borders & Curbs: Stone pillars and rails
                const curbGeo = new THREE.BoxGeometry(0.6, 0.5, 10);
                const curbMat = new THREE.MeshStandardMaterial({ color: 0x2d261e });
                
                const leftCurb = new THREE.Mesh(curbGeo, curbMat);
                leftCurb.position.set(-4.7, 0.25, 0);
                group.add(leftCurb);
                
                const rightCurb = new THREE.Mesh(curbGeo, curbMat);
                rightCurb.position.set(4.7, 0.25, 0);
                group.add(rightCurb);
                
                // Side Statues/Pillars (Temple Run vibe)
                const pillarHeight = 8 + Math.random() * 10;
                const pillarGeo = new THREE.BoxGeometry(3, pillarHeight, 3);
                const pillarMat = new THREE.MeshStandardMaterial({ color: 0x332b21, roughness: 0.9 });
                
                if (Math.random() > 0.3) {
                    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
                    leftPillar.name = 'leftWall'; // Keeps existing recycle logic
                    leftPillar.position.set(-8, pillarHeight / 2 - 1, 0);
                    leftPillar.receiveShadow = true;
                    group.add(leftPillar);
                }
                
                if (Math.random() > 0.3) {
                    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
                    rightPillar.name = 'rightWall';
                    rightPillar.position.set(8, pillarHeight / 2 - 1, 0);
                    rightPillar.receiveShadow = true;
                    group.add(rightPillar);
                }

                // Decorative Stone Markings (Subtle lane dividers)
                [0, 1, 2].forEach(lane => {
                    const lineGeo = new THREE.PlaneGeometry(0.1, 10);
                    const lineMat = new THREE.MeshStandardMaterial({ color: 0x5a4f40, transparent: true, opacity: 0.5 });
                    const line = new THREE.Mesh(lineGeo, lineMat);
                    line.rotation.x = -Math.PI / 2;
                    line.position.set((lane - 1) * 3, 0.02, 0);
                    group.add(line);
                });

                group.position.z = z;
                group.userData.z = z;
                return group;
            }
            
            update(dt) {
                const playerZ = this.engine.player.player.position.z;
                const totalLen = this.floorMeshes.length * 10; // 40 segments × 10 units each

                this.floorMeshes.forEach(segment => {
                    const relativeZ = segment.userData.z - playerZ;

                    // Segment has passed behind player — move it to the front
                    if (relativeZ > 15) {
                        const newZ = segment.userData.z - totalLen;
                        segment.position.z = newZ;
                        segment.userData.z  = newZ;

                        // Randomise side pillars for visual variety
                        segment.children.forEach(child => {
                            if (child.name === 'leftWall' || child.name === 'rightWall') {
                                child.scale.y = 0.5 + Math.random() * 1.5;
                            }
                        });
                    }
                });
            }
            
            setBiome(biome) {
                if (this.currentBiome !== biome) {
                    this.currentBiome = biome;
                    
                    const colors = this.biomes[biome];
                    this.scene.background = new THREE.Color(colors.fog);
                    this.scene.fog.color = new THREE.Color(colors.fog);
                }
            }
            
            reset() {
                this.currentBiome = 'road';
                this.transitionProgress = 1;
                
                const colors = this.biomes.road;
                this.scene.background = new THREE.Color(colors.fog);
                this.scene.fog.color = new THREE.Color(colors.fog);
            }
        }
