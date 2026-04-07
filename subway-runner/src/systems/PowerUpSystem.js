// Power-Up System - Handles power-ups and coins
import * as THREE from 'three';

export class PowerUpSystem {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        this.powerups = [];
        this.coins = [];
        
        this.powerUpConfigs = {
            magnet: { color: 0xff00ff, duration: 10, icon: '🧲' },
            speed: { color: 0x00ffff, duration: 5, icon: '⚡' },
            shield: { color: 0xffff00, duration: 8, icon: '🛡️' },
            jetpack: { color: 0xff6600, duration: 6, icon: '🚀' },
            slowmo: { color: 0x88ff00, duration: 4, icon: '🕒' }
        };
        
        this.activeEffects = {
            magnet: false,
            speed: false,
            shield: false,
            jetpack: false,
            slowmo: false
        };
        
        this.effectTimers = {};
        this.activeShield = false;
        
        this.createPool();
    }
    
    createPool() {
        for (let i = 0; i < 30; i++) {
            const mesh = new THREE.Mesh();
            mesh.visible = false;
            this.scene.add(mesh);
            this.powerups.push({ mesh, active: false, type: null });
        }
        
        for (let i = 0; i < 100; i++) {
            const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
            const mat = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                roughness: 0.3,
                metalness: 0.8
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = Math.PI / 2;
            mesh.visible = false;
            this.scene.add(mesh);
            this.coins.push({ mesh, active: false });
        }
    }
    
    spawn(x, y, z) {
        const types = Object.keys(this.powerUpConfigs);
        const type = types[Math.floor(Math.random() * types.length)];
        const config = this.powerUpConfigs[type];
        
        const powerup = this.powerups.find(p => !p.active);
        if (!powerup) return;
        
        const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const mat = new THREE.MeshStandardMaterial({
            color: config.color,
            roughness: 0.2,
            metalness: 0.5,
            emissive: config.color,
            emissiveIntensity: 0.3
        });
        
        powerup.mesh.geometry = geo;
        powerup.mesh.material = mat;
        powerup.mesh.position.set(x, y + 1, z);
        powerup.mesh.visible = true;
        powerup.mesh.userData.type = type;
        powerup.active = true;
        powerup.type = type;
        
        this.engine.effects.addPowerUpSpawn(powerup.mesh.position.clone());
    }
    
    spawnCoin(x, y, z) {
        const coin = this.coins.find(c => !c.active);
        if (!coin) return;
        
        coin.mesh.position.set(x, y, z);
        coin.mesh.visible = true;
        coin.active = true;
    }
    
    collectPowerUp(powerup) {
        const type = powerup.type;
        const config = this.powerUpConfigs[type];
        
        this.activeEffects[type] = true;
        this.effectTimers[type] = config.duration;
        
        if (type === 'shield') this.activeShield = true;
        if (type === 'jetpack') this.engine.environment.setBiome('air');
        if (type === 'speed') this.engine.currentSpeed *= 1.5;
        if (type === 'slowmo') this.engine.config.baseSpeed *= 0.5;
        
        this.engine.audio.playPowerUp();
        this.engine.effects.addPowerUpCollect(powerup.mesh.position.clone());
        this.engine.scoring.addScore(50, 'powerup');
        
        this.despawnPowerUp(powerup);
    }
    
    collectCoin(coin) {
        this.engine.scoring.addCoins(1);
        this.engine.audio.playCoin();
        this.engine.effects.addCoinCollect(coin.mesh.position.clone());
        this.despawnCoin(coin);
    }
    
    despawnPowerUp(powerup) {
        powerup.mesh.visible = false;
        powerup.active = false;
    }
    
    despawnCoin(coin) {
        coin.mesh.visible = false;
        coin.active = false;
    }
    
    update(dt) {
        const playerZ = this.engine.player.player.position.z;
        
        Object.keys(this.effectTimers).forEach(type => {
            if (this.effectTimers[type] > 0) {
                this.effectTimers[type] -= dt;
                
                if (this.effectTimers[type] <= 0) {
                    this.deactivateEffect(type);
                }
            }
        });
        
        this.powerups.forEach(powerup => {
            if (!powerup.active) return;
            
            const relativeZ = powerup.mesh.position.z - playerZ;
            if (relativeZ < -20 || relativeZ > this.engine.generator.renderDistance) {
                this.despawnPowerUp(powerup);
            }
            
            powerup.mesh.rotation.y += dt * 2;
            powerup.mesh.position.y = 1 + Math.sin(this.engine.elapsedTime * 3) * 0.2;
        });
        
        this.coins.forEach(coin => {
            if (!coin.active) return;
            
            const relativeZ = coin.mesh.position.z - playerZ;
            if (relativeZ < -20 || relativeZ > this.engine.generator.renderDistance) {
                this.despawnCoin(coin);
                return;
            }
            
            coin.mesh.rotation.z += dt * 3;
            
            if (this.activeEffects.magnet) {
                const playerPos = this.engine.player.player.position;
                const dir = playerPos.clone().sub(coin.mesh.position).normalize();
                coin.mesh.position.add(dir.multiplyScalar(30 * dt));
            }
        });
        
        this.engine.ui.updatePowerUps(this.activeEffects, this.effectTimers);
    }
    
    deactivateEffect(type) {
        this.activeEffects[type] = false;
        this.effectTimers[type] = 0;
        
        if (type === 'shield') this.activeShield = false;
        if (type === 'jetpack') this.engine.environment.setBiome('road');
        if (type === 'speed') this.engine.currentSpeed /= 1.5;
        if (type === 'slowmo') this.engine.config.baseSpeed *= 2;
    }
    
    reset() {
        this.powerups.forEach(p => this.despawnPowerUp(p));
        this.coins.forEach(c => this.despawnCoin(c));
        
        Object.keys(this.activeEffects).forEach(key => {
            this.activeEffects[key] = false;
            this.effectTimers[key] = 0;
        });
        this.activeShield = false;
    }
}
