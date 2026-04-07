// Camera System - Dynamic camera with FOV, shake, and transitions
import * as THREE from 'three';

export class CameraSystem {
    constructor(engine) {
        this.engine = engine;
        this.camera = engine.camera;
        
        this.basePosition = new THREE.Vector3(0, 5, 10);
        this.baseLookAt = new THREE.Vector3(0, 2, 0);
        
        this.currentFOV = 70;
        this.targetFOV = 70;
        
        this.shakeIntensity = 0;
        this.shakeDecay = 5;
        
        this.tilt = 0;
        this.tiltTarget = 0;
        
        this.transitionMode = false;
        this.transitionProgress = 0;
        
        this.fovPerSpeed = {
            min: 70,
            max: 90
        };
    }
    
    update(dt) {
        const speed = this.engine.currentSpeed || this.engine.config.baseSpeed;
        const speedRatio = speed / this.engine.config.maxSpeed;
        
        this.targetFOV = this.fovPerSpeed.min + (this.fovPerSpeed.max - this.fovPerSpeed.min) * speedRatio;
        this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, this.targetFOV, dt * 3);
        this.camera.fov = this.currentFOV;
        
        const player = this.engine.player.player;
        
        this.basePosition.set(0, 5, 10);
        this.camera.position.lerp(this.basePosition.clone().add(player.position), dt * 5);
        
        const lookAtTarget = this.baseLookAt.clone().add(new THREE.Vector3(0, 0, player.position.z + 5));
        this.camera.lookAt(lookAtTarget);
        
        this.tiltTarget = (this.engine.player.state.targetLane - 1) * 0.03;
        this.tilt = THREE.MathUtils.lerp(this.tilt, this.tiltTarget, dt * 8);
        this.camera.rotation.z = this.tilt;
        
        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= this.shakeDecay * dt;
            
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            
            this.camera.position.x += shakeX;
            this.camera.position.y += shakeY;
        }
        
        if (this.transitionMode) {
            this.transitionProgress += dt;
            
            if (this.transitionProgress > 1) {
                this.transitionMode = false;
                this.transitionProgress = 0;
            }
        }
        
        this.camera.updateProjectionMatrix();
    }
    
    addShake(intensity) {
        this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 1);
    }
    
    triggerTransition() {
        this.transitionMode = true;
        this.transitionProgress = 0;
        this.addShake(0.3);
    }
    
    nearMissEffect() {
        this.addShake(0.15);
        this.targetFOV = this.currentFOV + 5;
    }
    
    reset() {
        this.currentFOV = 70;
        this.targetFOV = 70;
        this.shakeIntensity = 0;
        this.tilt = 0;
        this.tiltTarget = 0;
        this.transitionMode = false;
        this.transitionProgress = 0;
    }
}
