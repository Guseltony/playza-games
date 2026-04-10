import * as THREE from 'three';

export class ProceduralGenerator {
            constructor(engine) {
                this.engine = engine;
                this.chunkSize = 60;
                this.renderDistance = 200;
                this.lastChunkZ = 0;
                this.difficulty = 1;
                this.currentBiome = 'railway';
                this.biomes = ['railway', 'road', 'bridge', 'snow'];
                this.biomeTimer = 30;
                
                this.init();
            }
            
            init() {
                this.lastChunkZ = -10;
            }
            
            update(dt) {
                const playerZ = this.engine.player.player.position.z;

                // Player moves in -Z. Keep generating while the furthest-ahead
                // generated chunk (lastChunkZ) isn't renderDistance in front of player.
                // "Ahead" = more negative Z, so condition: lastChunkZ > playerZ - renderDistance
                while (this.lastChunkZ > playerZ - this.renderDistance) {
                    this.generateChunk();
                }

                this.updateDifficulty(dt);
            }
            
            generateChunk() {
                const chunkZ = this.lastChunkZ;
                const patternCount = 8;
                const spacing    = 18;    // wider spacing for more "running" feel

                this.engine.environment.setBiome(this.currentBiome);

                for (let i = 0; i < patternCount; i++) {
                    const z = chunkZ - i * spacing; // Spawning forward (-Z)
                    this.spawnPattern(z);
                }

                this.lastChunkZ -= this.chunkSize;
            }

            spawnPattern(z) {
                const patternType = Math.random();
                const laneX = (lane) => (lane - 1) * this.engine.config.laneWidth;
                const diff = this.difficulty;

                if (patternType < 0.25) {
                    // Single obstacle — coins in BOTH free lanes
                    const blocked = this.getRandomLane();
                    this.engine.obstacles.spawn(laneX(blocked), 0, z, this.currentBiome);
                    [0, 1, 2].filter(l => l !== blocked).forEach(l => this.spawnCoinsInLane(l, z));
                }
                else if (patternType < 0.45) {
                    // Two obstacles — coins fill the one free lane
                    const freeLane = this.getRandomLane();
                    [0, 1, 2].forEach(lane => {
                        if (lane !== freeLane) this.engine.obstacles.spawn(laneX(lane), 0, z, this.currentBiome);
                        else this.spawnCoinsInLane(lane, z);
                    });
                }
                else if (patternType < 0.6) {
                    // Obstacle with scattered coins on every free lane
                    const blocked = this.getRandomLane();
                    this.engine.obstacles.spawn(laneX(blocked), 0, z, this.currentBiome);
                    [0, 1, 2].filter(l => l !== blocked).forEach(l => this.spawnCoinsInLane(l, z));
                    // Extra obstacle staggered 6 ahead
                    const blocked2 = this.getOtherLane(blocked);
                    this.engine.obstacles.spawn(laneX(blocked2), 0, z - 6, this.currentBiome);
                }
                else if (patternType < 0.75) {
                    // Zigzag: two obstacles offset by 5 units
                    const lane1 = this.getRandomLane();
                    const lane2 = this.getOtherLane(lane1);
                    this.engine.obstacles.spawn(laneX(lane1), 0, z,     this.currentBiome);
                    this.engine.obstacles.spawn(laneX(lane2), 0, z - 5, this.currentBiome);
                    // coins on the always-free lane
                    const free = [0,1,2].find(l => l !== lane1 && l !== lane2) ?? 1;
                    this.spawnCoinsInLane(free, z);
                    this.spawnCoinsInLane(free, z - 5);
                }
                else if (patternType < 0.88) {
                    // Wall of 2 then single — forces lane change
                    const passLane = this.getRandomLane();
                    [0, 1, 2].filter(l => l !== passLane)
                        .forEach(l => this.engine.obstacles.spawn(laneX(l), 0, z, this.currentBiome));
                    this.spawnCoinsInLane(passLane, z);
                    // Second set shifted
                    const passLane2 = this.getOtherLane(passLane);
                    [0, 1, 2].filter(l => l !== passLane2)
                        .forEach(l => this.engine.obstacles.spawn(laneX(l), 0, z - 8, this.currentBiome));
                    this.spawnCoinsInLane(passLane2, z - 8);
                }
                else {
                    // Triple coin lanes — no obstacles, reward stretch
                    [0, 1, 2].forEach(l => this.spawnCoinsInLane(l, z));
                }

                // Powerup every ~8 patterns on average
                if (Math.random() < 0.13) {
                    const pl = this.getRandomLane();
                    this.engine.powerups.spawn(laneX(pl), 0, z - 3);
                }
            }

            spawnCoinsInLane(lane, z) {
                const x = (lane - 1) * this.engine.config.laneWidth;
                // 10 coins per row, 1.8 units apart
                for (let i = 0; i < 10; i++) {
                    this.engine.powerups.spawnCoin(x, 1, z - i * 1.8);
                }
            }

            getOtherLane(lane) {
                const lanes = [0, 1, 2].filter(l => l !== lane);
                return lanes[Math.floor(Math.random() * lanes.length)];
            }
            
            getRandomLane() {
                return Math.floor(Math.random() * 3);
            }
            
            updateDifficulty(dt) {
                const gameTime = this.engine.gameTime;
                this.difficulty = 1 + gameTime / 100;
                this.engine.currentSpeed = Math.min(this.engine.config.baseSpeed + gameTime * 0.15, this.engine.config.maxSpeed);
                
                this.biomeTimer -= dt;
                if (this.biomeTimer <= 0) {
                    this.currentBiome = this.biomes[Math.floor(Math.random() * this.biomes.length)];
                    this.biomeTimer = 40;
                }
            }
            
            reset() {
                // Start lastChunkZ far ahead of the player to give a clear starting runway
                this.lastChunkZ = -80;
                this.difficulty = 1;
                this.currentBiome = 'railway';
                this.biomeTimer = 30;
            }
        }
