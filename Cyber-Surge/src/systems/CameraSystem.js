import * as THREE from 'three';

export class CameraSystem {
            constructor(engine) {
                this.engine  = engine;
                this.camera  = engine.camera;
                this.lookTarget = new THREE.Vector3();
                this.shakeIntensity = 0;
                this.shakeDecay     = 5;
            }

            update(dt) {
                const player     = this.engine.player.player;
                const speed      = this.engine.currentSpeed || this.engine.config.baseSpeed;
                const speedRatio = speed / this.engine.config.maxSpeed;

                // Camera sits behind-and-above the player, always
                const camX = player.position.x * 0.3;
                const camY = player.position.y + 5.5;
                // +11 in Z = behind the player (player moves in -Z)
                const camZ = player.position.z + 11;

                this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camX, dt * 8);
                this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, camY, dt * 5);
                this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, camZ, dt * 8);

                // Look slightly ahead of where the player IS (down the track)
                this.lookTarget.set(
                    player.position.x * 0.5,  // slight X tracking
                    player.position.y + 1.2,  // eye-level
                    player.position.z - 12    // 12 units ahead (in -Z)
                );
                this.camera.lookAt(this.lookTarget);

                // Speed-based FOV
                const targetFOV = 72 + 18 * speedRatio;
                this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, dt * 2);

                // Camera shake on impacts
                if (this.shakeIntensity > 0) {
                    this.shakeIntensity -= this.shakeDecay * dt;
                    this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity * 0.3;
                    this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.15;
                }

                this.camera.updateProjectionMatrix();
            }

            addShake(intensity) {
                this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 1);
            }

            reset() {
                // Snap camera to a sensible start position
                this.camera.position.set(0, 5.5, 11);
                this.camera.fov = 72;
                this.shakeIntensity = 0;
            }
        }
