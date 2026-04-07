// Procedural Generation Engine - Handles infinite level generation with difficulty scaling
export class ProceduralGenerator {
    constructor(engine) {
        this.engine = engine;
        this.chunkSize = 50;
        this.renderDistance = 150;
        this.lastChunkZ = 0;
        this.difficulty = 1;
        this.biomeWeights = {
            railway: 30,
            road: 30,
            bridge: 15,
            air: 10,
            snow: 15
        };
        this.patterns = this.initPatterns();
        this.currentBiome = 'road';
        this.nextBiome = 'road';
    }
    
    initPatterns() {
        return {
            easy: [
                { type: 'simple', obstacles: 1, spacing: 15 },
                { type: 'double', obstacles: 2, spacing: 12 },
                { type: 'gaps', obstacles: 1, spacing: 20 }
            ],
            medium: [
                { type: 'triple', obstacles: 3, spacing: 10 },
                { type: 'timing', obstacles: 2, spacing: 8 },
                { type: 'pattern', obstacles: 4, spacing: 7 }
            ],
            hard: [
                { type: 'rush', obstacles: 4, spacing: 6 },
                { type: 'switch', obstacles: 3, spacing: 5 },
                { type: 'impossible', obstacles: 5, spacing: 4 }
            ]
        };
    }
    
    update(dt) {
        const playerZ = this.engine.player.player.position.z;
        
        if (playerZ > this.lastChunkZ - this.renderDistance) {
            this.generateChunk();
        }
        
        this.updateDifficulty();
        this.checkBiomeTransition();
    }
    
    generateChunk() {
        const chunkZ = this.lastChunkZ;
        const pattern = this.getWeightedPattern();
        
        this.engine.environment.setBiome(this.currentBiome);
        
        for (let i = 0; i < 5; i++) {
            const z = chunkZ + i * pattern.spacing;
            const lanes = this.getPatternLanes(pattern);
            
            lanes.forEach(lane => {
                this.spawnObstacle(lane, z);
                if (Math.random() < 0.3) this.spawnCoin(lane, z + 2);
            });
            
            if (Math.random() < 0.1) {
                this.spawnPowerUp(this.getRandomLane(), z + 5);
            }
        }
        
        this.lastChunkZ += this.chunkSize;
    }
    
    getWeightedPattern() {
        const rand = Math.random();
        let pool;
        
        if (this.difficulty < 1.5) pool = this.patterns.easy;
        else if (this.difficulty < 2.5) pool = this.patterns.medium;
        else pool = this.patterns.hard;
        
        return pool[Math.floor(Math.random() * pool.length)];
    }
    
    getPatternLanes(pattern) {
        const lanes = [];
        
        switch (pattern.type) {
            case 'simple':
                lanes.push(this.getRandomLane());
                break;
            case 'double':
                const l1 = this.getRandomLane();
                lanes.push(l1);
                if (l1 > 0) lanes.push(l1 - 1);
                else if (l1 < 2) lanes.push(l1 + 1);
                break;
            case 'triple':
                lanes.push(0, 1, 2);
                break;
            case 'gaps':
                lanes.push(this.getRandomLane());
                lanes.push((this.getRandomLane() + 1) % 3);
                break;
            default:
                for (let i = 0; i < pattern.obstacles; i++) {
                    lanes.push(i % 3);
                }
        }
        
        return [...new Set(lanes)];
    }
    
    getRandomLane() {
        return Math.floor(Math.random() * 3);
    }
    
    spawnObstacle(lane, z) {
        const laneX = (lane - 1) * this.engine.config.laneWidth;
        this.engine.obstacles.spawn(laneX, 0, z, this.currentBiome);
    }
    
    spawnCoin(lane, z) {
        const laneX = (lane - 1) * this.engine.config.laneWidth;
        this.engine.powerups.spawnCoin(laneX, 1, z);
    }
    
    spawnPowerUp(lane, z) {
        const laneX = (lane - 1) * this.engine.config.laneWidth;
        this.engine.powerups.spawn(laneX, 1, z);
    }
    
    updateDifficulty() {
        const gameTime = this.engine.gameTime;
        this.difficulty = 1 + gameTime / 120;
        
        this.engine.config.baseSpeed = 15 + gameTime * 0.1;
    }
    
    checkBiomeTransition() {
        const transitions = {
            railway: { road: 0.3, bridge: 0.2, snow: 0.2 },
            road: { railway: 0.3, bridge: 0.2, snow: 0.2 },
            bridge: { air: 0.4, road: 0.3, snow: 0.3 },
            air: { bridge: 0.5, road: 0.3, snow: 0.2 },
            snow: { road: 0.3, railway: 0.3, bridge: 0.2 }
        };
        
        const dist = Math.abs(this.engine.player.player.position.z - this.lastChunkZ);
        
        if (dist < 30 && Math.random() < 0.02) {
            const weights = transitions[this.currentBiome];
            const biomes = Object.keys(weights);
            const r = Math.random();
            let cumulative = 0;
            
            for (const biome of biomes) {
                cumulative += weights[biome];
                if (r < cumulative) {
                    this.nextBiome = biome;
                    this.engine.environment.transitionTo(biome);
                    break;
                }
            }
        }
    }
    
    reset() {
        this.lastChunkZ = 20;
        this.difficulty = 1;
        this.currentBiome = 'road';
        this.nextBiome = 'road';
    }
}
