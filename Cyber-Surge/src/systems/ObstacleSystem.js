import * as THREE from 'three';

export class ObstacleSystem {
            constructor(engine) {
                this.engine = engine;
                this.scene = engine.scene;
                this.obstacles = [];
                this.pool = [];
                this.poolSize = 50;
                
                this.obstacleConfigs = {
                    railway: [
                        { type: 'train', width: 2.8, height: 4.5, color: 0xcc0000 },
                        { type: 'barrier', width: 2.5, height: 1.2, color: 0xffaa00 },
                        { type: 'pole', width: 0.5, height: 4, color: 0x666666 }
                    ],
                    road: [
                        { type: 'car', width: 2, height: 1.8, color: 0x3366cc },
                        { type: 'bus', width: 2.8, height: 4.0, color: 0xffcc00 },
                        { type: 'cone', width: 0.5, height: 0.8, color: 0xff6600 }
                    ],
                    bridge: [
                        { type: 'gap', width: 2, height: 0, color: 0x000000 },
                        { type: 'plank', width: 2.5, height: 0.2, color: 0x8b4513 },
                        { type: 'railing', width: 0.3, height: 1.2, color: 0x666666 }
                    ],
                    air: [
                        { type: 'drone', width: 1.5, height: 1.5, color: 0x333333 },
                        { type: 'platform', width: 2, height: 0.3, color: 0x88ccff },
                        { type: 'cloud', width: 3, height: 1, color: 0xffffff }
                    ],
                    snow: [
                        { type: 'icewall', width: 2.5, height: 2, color: 0xaaddff },
                        { type: 'rock', width: 1.5, height: 1.5, color: 0x777777 },
                        { type: 'tree', width: 1, height: 4, color: 0x228822 }
                    ]
                };
                
                this.initPool();
            }
            
            initPool() {
                // Doubled pool for higher density
                for (let i = 0; i < 100; i++) {
                    const mesh = new THREE.Mesh();
                    mesh.visible = false;
                    this.scene.add(mesh);
                    this.pool.push({ mesh, active: false, biome: 'road', config: null });
                }
            }
            
            spawn(x, y, z, biome, forcedType = null) {
                let obstacle = this.pool.find(p => !p.active);
                
                if (!obstacle) {
                    const mesh = new THREE.Mesh();
                    this.scene.add(mesh);
                    obstacle = { mesh, active: false, biome: 'road', config: null };
                    this.pool.push(obstacle);
                }
                
                const configs = this.obstacleConfigs[biome] || this.obstacleConfigs.road;
                let config;
                
                if (forcedType) {
                    // Find matching type in any biome config
                    Object.values(this.obstacleConfigs).some(cb => {
                        const found = cb.find(c => c.type === forcedType);
                        if (found) {
                            config = found;
                            return true;
                        }
                        return false;
                    });
                }
                
                if (!config && forcedType === 'arch') {
                    config = { type: 'arch', width: 2.5, height: 2.5, color: 0x444444 };
                }

                if (!config) {
                    config = configs[Math.floor(Math.random() * configs.length)];
                }
                
                this.createObstacleMesh(obstacle.mesh, config);
                
                obstacle.mesh.position.set(x, y + config.height / 2, z);
                
                if (config.type === 'arch') {
                    obstacle.mesh.position.y += 0.5; // Lift up for sliding
                }

                obstacle.mesh.visible = true;
                obstacle.active = true;
                obstacle.biome = biome;
                obstacle.config = config;
                
                this.obstacles.push(obstacle);
            }
            
            createObstacleMesh(mesh, config) {
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) mesh.material.dispose();
                
                let geometry;
                
                switch (config.type) {
                    case 'train':
                    case 'bus':
                        geometry = new THREE.BoxGeometry(config.width, config.height, 5);
                        break;
                    case 'car':
                        geometry = new THREE.BoxGeometry(config.width, config.height, 2.5);
                        break;
                    case 'arch':
                        geometry = new THREE.BoxGeometry(config.width, 0.4, 1);
                        break;
                    case 'drone':
                        geometry = new THREE.OctahedronGeometry(config.width / 2);
                        break;
                    case 'platform':
                    case 'plank':
                        geometry = new THREE.BoxGeometry(config.width, config.height, 4);
                        break;
                    case 'cone':
                    case 'tree':
                        geometry = new THREE.ConeGeometry(config.width / 2, config.height, 8);
                        break;
                    case 'gap':
                        mesh.visible = false;
                        return;
                    default:
                        geometry = new THREE.BoxGeometry(config.width, config.height, 1);
                }
                
                const material = new THREE.MeshStandardMaterial({
                    color: config.color,
                    roughness: 0.6,
                    metalness: 0.2
                });
                
                mesh.geometry = geometry;
                mesh.material = material;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                mesh.userData.type = config.type;
            }
            
            update(dt) {
                const playerZ = this.engine.player.player.position.z;
                const renderDist = this.engine.generator.renderDistance;

                this.obstacles = this.obstacles.filter(obstacle => {
                    // distanceAhead is positive if object is ahead of player (more negative Z)
                    // distanceAhead is negative if object is behind player (less negative Z)
                    const distanceAhead = playerZ - obstacle.mesh.position.z;

                    if (distanceAhead > renderDist || distanceAhead < -20) {
                        this.despawn(obstacle);
                        return false;
                    }

                    return true;
                });
                
                this.obstacles.forEach(obstacle => {
                    if (obstacle.config.type === 'drone') {
                        obstacle.mesh.position.y += Math.sin(this.engine.elapsedTime * 2) * 0.02;
                        obstacle.mesh.rotation.y += dt;
                    }
                });
            }
            
            despawn(obstacle) {
                obstacle.mesh.visible = false;
                obstacle.active = false;
            }
            
            removeObstacle(obstacle) {
                this.despawn(obstacle);
                this.obstacles = this.obstacles.filter(o => o !== obstacle);
            }
            
            reset() {
                this.obstacles.forEach(o => this.despawn(o));
                this.obstacles = [];
            }
        }
