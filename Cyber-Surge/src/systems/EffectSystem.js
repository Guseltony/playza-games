import * as THREE from 'three';

export class EffectSystem {
            constructor(engine) {
                this.engine = engine;
                this.scene = engine.scene;
                this.particles = [];
                this.maxParticles = 500;
                
                this.initParticlePool();
            }
            
            initParticlePool() {
                for (let i = 0; i < this.maxParticles; i++) {
                    const geo = new THREE.BufferGeometry();
                    const positions = new Float32Array(3);
                    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    
                    const mat = new THREE.PointsMaterial({
                        size: 0.15,
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.8,
                        sizeAttenuation: true
                    });
                    
                    const points = new THREE.Points(geo, mat);
                    points.visible = false;
                    this.scene.add(points);
                    
                    this.particles.push({
                        points,
                        velocity: new THREE.Vector3(),
                        life: 0,
                        maxLife: 1,
                        active: false
                    });
                }
            }
            
            spawnParticle(position, config) {
                const particle = this.particles.find(p => !p.active);
                if (!particle) return;
                
                const positions = particle.points.geometry.attributes.position.array;
                positions[0] = position.x;
                positions[1] = position.y;
                positions[2] = position.z;
                
                particle.points.geometry.attributes.position.needsUpdate = true;
                
                particle.points.material.color.setHex(config.color || 0xffffff);
                particle.points.material.opacity = config.opacity || 0.8;
                
                particle.velocity.copy(config.velocity || new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2
                ));
                
                particle.life = config.life || 1;
                particle.maxLife = particle.life;
                particle.active = true;
                particle.points.visible = true;
            }
            
            addDust(position) {
                for (let i = 0; i < 8; i++) {
                    this.spawnParticle(position.clone(), {
                        color: 0xaaaaaa,
                        velocity: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, -Math.random() * 2),
                        life: 0.5,
                        opacity: 0.6
                    });
                }
            }
            
            addJump(position) {
                for (let i = 0; i < 12; i++) {
                    this.spawnParticle(position.clone(), {
                        color: 0xff6b35,
                        velocity: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, -Math.random() * 3),
                        life: 0.6,
                        opacity: 0.8
                    });
                }
            }
            
            addSlide(position) {
                for (let i = 0; i < 15; i++) {
                    this.spawnParticle(position.clone().add(new THREE.Vector3(0, 0.2, 0)), {
                        color: 0x4488ff,
                        velocity: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random(), -Math.random() * 4),
                        life: 0.4,
                        opacity: 0.7
                    });
                }
            }
            
            addLand(position) {
                for (let i = 0; i < 20; i++) {
                    this.spawnParticle(position.clone(), {
                        color: 0x888888,
                        velocity: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 2, -Math.random() * 2),
                        life: 0.5,
                        opacity: 0.8
                    });
                }
                this.engine.cameraSystem.addShake(0.1);
            }
            
            addCoinCollect(position) {
                for (let i = 0; i < 10; i++) {
                    this.spawnParticle(position.clone(), {
                        color: 0xffd700,
                        velocity: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 4 + 2, (Math.random() - 0.5) * 4),
                        life: 0.8,
                        opacity: 1
                    });
                }
            }
            
            addPowerUpSpawn(position) {
                for (let i = 0; i < 20; i++) {
                    this.spawnParticle(position.clone(), {
                        color: 0x00ffff,
                        velocity: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3 + 1, (Math.random() - 0.5) * 3),
                        life: 1,
                        opacity: 0.9
                    });
                }
            }
            
            addPowerUpCollect(position) {
                for (let i = 0; i < 25; i++) {
                    const angle = (i / 25) * Math.PI * 2;
                    this.spawnParticle(position.clone(), {
                        color: 0xffff00,
                        velocity: new THREE.Vector3(Math.cos(angle) * 5, Math.random() * 3, Math.sin(angle) * 5),
                        life: 0.6,
                        opacity: 1
                    });
                }
                this.engine.cameraSystem.addShake(0.2);
            }
            
            addShieldBreak(position) {
                for (let i = 0; i < 30; i++) {
                    const angle = (i / 30) * Math.PI * 2;
                    this.spawnParticle(position.clone(), {
                        color: 0xffff00,
                        velocity: new THREE.Vector3(Math.cos(angle) * 8, Math.random() * 5, Math.sin(angle) * 8),
                        life: 0.8,
                        opacity: 1
                    });
                }
                this.engine.cameraSystem.addShake(0.4);
            }
            
            addNearMiss() {
                this.engine.cameraSystem.addShake(0.15);
            }
            
            update(dt) {
                this.particles.forEach(particle => {
                    if (!particle.active) return;
                    
                    particle.life -= dt;
                    
                    if (particle.life <= 0) {
                        particle.active = false;
                        particle.points.visible = false;
                        return;
                    }
                    
                    const positions = particle.points.geometry.attributes.position.array;
                    positions[0] += particle.velocity.x * dt;
                    positions[1] += particle.velocity.y * dt;
                    positions[2] += particle.velocity.z * dt;
                    
                    particle.velocity.y -= 9.8 * dt * 0.5;
                    
                    particle.points.geometry.attributes.position.needsUpdate = true;
                    particle.points.material.opacity = (particle.life / particle.maxLife) * 0.8;
                });
            }
            
            reset() {
                this.particles.forEach(p => {
                    p.active = false;
                    p.points.visible = false;
                });
            }
        }
