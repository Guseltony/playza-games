// Player Controller - Handles player movement, jumping, sliding, and lane switching
import * as THREE from 'three';

export class PlayerController {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        
        this.state = {
            lane: 1,
            targetLane: 1,
            y: 0,
            velocityY: 0,
            isJumping: false,
            isSliding: false,
            slideTimer: 0,
            isGrounded: true,
            z: 0
        };
        
        this.config = {
            laneWidth: engine.config.laneWidth,
            laneSwitchDuration: engine.config.laneSwitchDuration,
            jumpForce: engine.config.jumpForce,
            gravity: engine.config.gravity,
            slideDuration: engine.config.slideDuration,
            groundY: 0,
            playerHeight: 1.8,
            slideHeight: 0.9,
            hitboxRadius: 0.5
        };
        
        this.createPlayer();
        this.createTrail();
    }
    
    createPlayer() {
        const group = new THREE.Group();
        
        const bodyGeo = new THREE.CapsuleGeometry(0.4, 1, 8, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xff6b35,
            roughness: 0.3,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1;
        body.castShadow = true;
        group.add(body);
        
        const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ 
            color: 0xffd93d,
            roughness: 0.4
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.9;
        head.castShadow = true;
        group.add(head);
        
        const visorGeo = new THREE.BoxGeometry(0.5, 0.15, 0.1);
        const visorMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a2e,
            roughness: 0.1,
            metalness: 0.8
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 1.9, 0.25);
        group.add(visor);
        
        const leftLegGeo = new THREE.CapsuleGeometry(0.12, 0.5, 4, 8);
        const legMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a2e,
            roughness: 0.5
        });
        const leftLeg = new THREE.Mesh(leftLegGeo, legMat);
        leftLeg.position.set(-0.2, 0.4, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(leftLegGeo, legMat);
        rightLeg.position.set(0.2, 0.4, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);
        
        group.position.set(this.getLaneX(1), this.config.groundY, 0);
        this.scene.add(group);
        
        this.player = group;
        this.body = body;
        this.head = head;
        this.leftLeg = leftLeg;
        this.rightLeg = rightLeg;
    }
    
    createTrail() {
        const trailGeo = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(60);
        trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        
        const trailMat = new THREE.MeshBasicMaterial({
            color: 0xff6b35,
            transparent: true,
            opacity: 0.4
        });
        
        this.trail = new THREE.Mesh(trailGeo, trailMat);
        this.trailPositions = [];
        this.scene.add(this.trail);
    }
    
    getLaneX(lane) {
        return (lane - 1) * this.config.laneWidth - this.config.laneWidth;
    }
    
    moveLeft() {
        if (this.state.targetLane > 0) {
            this.state.targetLane--;
            this.engine.audio.playWhoosh();
            this.engine.effects.addDust(this.player.position.clone());
        }
    }
    
    moveRight() {
        if (this.state.targetLane < 2) {
            this.state.targetLane++;
            this.engine.audio.playWhoosh();
            this.engine.effects.addDust(this.player.position.clone());
        }
    }
    
    jump() {
        if (!this.state.isJumping && this.state.isGrounded) {
            this.state.velocityY = this.config.jumpForce;
            this.state.isJumping = true;
            this.state.isGrounded = false;
            this.engine.audio.playJump();
            this.engine.effects.addJump(this.player.position.clone());
        }
    }
    
    slide() {
        if (!this.state.isSliding && !this.state.isJumping) {
            this.state.isSliding = true;
            this.state.slideTimer = this.config.slideDuration;
            this.engine.audio.playSlide();
            this.engine.effects.addSlide(this.player.position.clone());
        }
    }
    
    stopSlide() {
        this.state.isSliding = false;
        this.state.slideTimer = 0;
    }
    
    update(dt) {
        this.updateLaneSwitch(dt);
        this.updateJump(dt);
        this.updateSlide(dt);
        this.updateAnimation(dt);
        this.updateTrail(dt);
        this.checkCollisions();
    }
    
    updateLaneSwitch(dt) {
        const targetX = this.getLaneX(this.state.targetLane);
        const diff = targetX - this.player.position.x;
        
        if (Math.abs(diff) > 0.05) {
            const speed = this.config.laneWidth / this.config.laneSwitchDuration;
            this.player.position.x += Math.sign(diff) * speed * dt;
        } else {
            this.player.position.x = targetX;
            this.state.lane = this.state.targetLane;
        }
    }
    
    updateJump(dt) {
        if (!this.state.isGrounded) {
            this.state.velocityY -= this.config.gravity * dt;
            this.player.position.y += this.state.velocityY * dt;
            
            if (this.player.position.y <= this.config.groundY) {
                this.player.position.y = this.config.groundY;
                this.state.velocityY = 0;
                this.state.isJumping = false;
                this.state.isGrounded = true;
                this.engine.effects.addLand(this.player.position.clone());
            }
        }
    }
    
    updateSlide(dt) {
        if (this.state.isSliding) {
            this.state.slideTimer -= dt;
            
            if (this.state.slideTimer <= 0) {
                this.state.isSliding = false;
            }
        }
        
        const targetHeight = this.state.isSliding ? this.config.slideHeight : this.config.playerHeight;
        this.player.scale.y = THREE.MathUtils.lerp(this.player.scale.y, targetHeight / this.config.playerHeight, dt * 15);
    }
    
    updateAnimation(dt) {
        const speed = this.engine.currentSpeed || this.engine.config.baseSpeed;
        const animSpeed = speed * 2;
        
        this.leftLeg.rotation.x = Math.sin(this.elapsedTime * animSpeed) * 0.5;
        this.rightLeg.rotation.x = Math.sin(this.elapsedTime * animSpeed + Math.PI) * 0.5;
        
        if (this.state.isJumping) {
            this.leftLeg.rotation.x = -0.3;
            this.rightLeg.rotation.x = -0.3;
        }
    }
    
    updateTrail(dt) {
        this.trailPositions.unshift(this.player.position.clone());
        if (this.trailPositions.length > 20) {
            this.trailPositions.pop();
        }
        
        const positions = this.trail.geometry.attributes.position.array;
        for (let i = 0; i < this.trailPositions.length; i++) {
            const pos = this.trailPositions[i];
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y + 0.5;
            positions[i * 3 + 2] = pos.z;
        }
        this.trail.geometry.attributes.position.needsUpdate = true;
    }
    
    checkCollisions() {
        const playerPos = this.player.position;
        const playerBox = new THREE.Box3().setFromObject(this.player);
        
        for (const obstacle of this.engine.obstacles.obstacles) {
            if (!obstacle.mesh) continue;
            
            const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);
            
            if (playerBox.intersectsBox(obstacleBox)) {
                if (this.engine.powerups.activeShield) {
                    this.engine.powerups.activeShield = false;
                    this.engine.effects.addShieldBreak(obstacle.mesh.position.clone());
                    this.engine.obstacles.removeObstacle(obstacle);
                    this.engine.audio.playShield();
                } else {
                    this.engine.gameOver();
                    return;
                }
            }
        }
        
        for (const powerup of this.engine.powerups.powerups) {
            if (!powerup.mesh) continue;
            
            const powerupBox = new THREE.Box3().setFromObject(powerup.mesh);
            
            if (playerBox.intersectsBox(powerupBox)) {
                this.engine.powerups.collectPowerUp(powerup);
            }
        }
        
        for (const coin of this.engine.powerups.coins) {
            if (!coin.mesh) continue;
            
            const coinBox = new THREE.Box3().setFromObject(coin.mesh);
            
            if (playerBox.intersectsBox(coinBox)) {
                this.engine.powerups.collectCoin(coin);
            }
        }
    }
    
    getPosition() {
        return this.player.position.clone();
    }
    
    reset() {
        this.state = {
            lane: 1,
            targetLane: 1,
            y: 0,
            velocityY: 0,
            isJumping: false,
            isSliding: false,
            slideTimer: 0,
            isGrounded: true,
            z: 0
        };
        
        this.player.position.set(this.getLaneX(1), this.config.groundY, 0);
        this.player.scale.y = 1;
        this.trailPositions = [];
    }
}
