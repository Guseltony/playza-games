import * as THREE from 'three';
const gsap = window.gsap;

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.units = []; // Player Units
        this.unitCount = 5;
        this.gunPower = 1;
        
        this.lanes = [-6, 0, 6];
        this.currentLane = 1;
        this.gameState = 'START';
        this.distance = 0;
        this.score = 0;
        
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.gates = [];
        
        this.moveSpeed = 0.6;
        this.spawnTimer = 0;
        this.fireTimer = 0;
        
        this.init();
        this.setupLights();
        this.setupEventListeners();
        
        window.gameInstance = this;
        this.animate();
    }

    init() {
        this.scene.background = new THREE.Color(0xadd8e6);
        this.scene.fog = new THREE.Fog(0xadd8e6, 50, 180);

        const bridgeGeo = new THREE.BoxGeometry(20, 1, 1000);
        const bridgeMat = new THREE.MeshPhongMaterial({ color: 0x777777 });
        const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.z = -400;
        this.scene.add(bridge);

        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 1000), new THREE.MeshPhongMaterial({ color: 0x333333 }));
        railL.position.set(-10, 2, -400);
        this.scene.add(railL);
        const railR = railL.clone();
        railR.position.set(10, 2, -400);
        this.scene.add(railR);

        this.updatePlayerCrowd();
        this.camera.position.set(0, 18, 35);
        this.camera.lookAt(0, 0, -10);
    }

    setupLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(15, 30, 20);
        this.scene.add(sun);
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'PLAYING') return;
            if (e.key === 'a' || e.key === 'ArrowLeft') this.moveLane(-1);
            if (e.key === 'd' || e.key === 'ArrowRight') this.moveLane(1);
        });
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    moveLane(dir) {
        this.currentLane = Math.max(0, Math.min(2, this.currentLane + dir));
        const targetX = this.lanes[this.currentLane];
        this.units.forEach((u, i) => {
            gsap.to(u.position, {
                x: targetX + (i % 5 - 2.5) * 1.2,
                duration: 0.25,
                ease: "power2.out"
            });
        });
    }

    start() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.distance = 0;
        this.unitCount = 5;
        this.gunPower = 1;
        this.moveSpeed = 0.6;
        
        document.body.classList.add('playing');
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.remove('active');
        
        this.clearScene();
        this.updatePlayerCrowd();
    }

    clearScene() {
        [this.enemies, this.gates, this.bullets, this.enemyBullets].forEach(arr => {
            arr.forEach(obj => this.scene.remove(obj.mesh || obj));
        });
        this.enemies = []; this.gates = []; this.bullets = []; this.enemyBullets = [];
    }

    gameOver() {
        this.gameState = 'GAMEOVER';
        document.getElementById('game-over-screen').classList.add('active');
        document.getElementById('final-score').textContent = this.score;
        this.units.forEach(u => this.scene.remove(u));
        this.units = [];
    }

    updatePlayerCrowd() {
        this.units.forEach(u => this.scene.remove(u));
        this.units = [];
        
        const count = Math.min(this.unitCount, 150);
        for(let i=0; i<count; i++) {
            const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.6, 4, 8), new THREE.MeshPhongMaterial({ color: 0x0088ff }));
            const row = Math.floor(i / 6);
            const col = i % 6;
            mesh.position.set(this.lanes[this.currentLane] + (col - 2.5) * 1.2, 1.2, 15 + row * 1.5);
            this.scene.add(mesh);
            this.units.push(mesh);
        }
        document.getElementById('score-val').textContent = this.unitCount;
        document.getElementById('gun-power-val').textContent = this.gunPower;
    }

    spawnEntities() {
        this.spawnTimer++;
        if (this.spawnTimer % 140 === 0) this.spawnGates();
        
        const hordeFreq = Math.max(15, 40 - Math.floor(this.distance / 200));
        if (this.spawnTimer % hordeFreq === 0) this.spawnLegionCluster();
        
        if (this.spawnTimer % 600 === 0) this.spawnGiantBoss();
    }

    spawnGates() {
        // Left Lane: Multiplier (Squad size)
        const multTypes = [
            { label: 'x2', val: 2, op: 'mult', color: 0x00ffff },
            { label: '+10', val: 10, op: 'add', color: 0x00ff00 }
        ];
        const leftType = multTypes[Math.floor(Math.random()*multTypes.length)];
        this.createGate(-6.5, leftType);

        // Right Lane: Gun Power
        const gunType = { label: 'GUN+', val: 1, op: 'gun', color: 0xffaa00 };
        this.createGate(6.5, gunType);
    }

    createGate(x, type) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), new THREE.MeshBasicMaterial({ color: type.color, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
        mesh.position.set(x, 4, -200);
        this.scene.add(mesh);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256; canvas.height = 128;
        ctx.fillStyle = 'white'; ctx.font = 'bold 80px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(type.label, 128, 85);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
        sprite.scale.set(4, 2, 1);
        mesh.add(sprite);
        this.gates.push({ mesh, type });
    }

    spawnLegionCluster() {
        const count = 10 + Math.floor(this.distance / 50);
        // Cluster in the middle lane (Combat Zone)
        for(let i=0; i<count; i++) {
            const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 4, 8), new THREE.MeshPhongMaterial({ color: 0xee0000 }));
            // Standardizing cluster around x=0 (middle)
            const rx = (Math.random() - 0.5) * 8; 
            const rz = -180 - (Math.random() * 20);
            mesh.position.set(rx, 1, rz);
            this.scene.add(mesh);
            this.enemies.push({ mesh, hp: 1, size: 0.8, canFire: this.distance > 400 });
        }
    }

    spawnGiantBoss() {
        const hp = 80 + Math.floor(this.distance / 2);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(6, 12, 6), new THREE.MeshPhongMaterial({ color: 0x660000 }));
        mesh.position.set(0, 6, -220); // Always in center
        this.scene.add(mesh);
        this.enemies.push({ mesh, hp, size: 5, isGiant: true, fireTimer: 0 });
    }

    fireWeapon() {
        if (this.fireTimer > 0) { this.fireTimer--; return; }
        this.fireTimer = Math.max(1, 8 - this.gunPower);

        this.units.forEach((u, i) => {
            if (i > 25) return;
            const b = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00ffff }));
            b.position.copy(u.position);
            this.scene.add(b);
            this.bullets.push({ mesh: b, vz: -2 });
        });
    }

    enemyCombat() {
        this.enemies.forEach(e => {
            if (e.isGiant) {
                e.fireTimer++;
                if (e.fireTimer % 60 === 0) this.spawnEnemyBullet(e.mesh.position, 1.4);
            } else if (e.canFire) {
                if (Math.random() > 0.99) this.spawnEnemyBullet(e.mesh.position, 1);
            }
        });
    }

    spawnEnemyBullet(pos, speed) {
        // Warning fix: MeshBasicMaterial has no emissive. Use MeshPhongMaterial.
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000 }));
        b.position.copy(pos);
        this.scene.add(b);
        this.enemyBullets.push({ mesh: b, vz: speed });
    }

    handleCollisions() {
        // Player Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (b.mesh.position.distanceTo(e.mesh.position) < (e.size + 1)) {
                    e.hp--; this.scene.remove(b.mesh); this.bullets.splice(i, 1);
                    if (e.hp <= 0) {
                        this.score += e.isGiant ? 500 : 10;
                        document.getElementById('distance-val').textContent = this.score;
                        this.scene.remove(e.mesh); this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }

        // Enemy Bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            for (let k = this.units.length - 1; k >= 0; k--) {
                if (eb.mesh.position.distanceTo(this.units[k].position) < 1.5) {
                    this.unitCount--; this.scene.remove(this.units[k]); this.units.splice(k, 1);
                    this.scene.remove(eb.mesh); this.enemyBullets.splice(i, 1);
                    if (this.unitCount <= 0) this.gameOver();
                    break;
                }
            }
        }

        // Body Collision
        this.enemies.forEach((e, j) => {
            if (e.mesh.position.z > 10) {
                this.units.forEach((u, k) => {
                    if (u.position.distanceTo(e.mesh.position) < (e.size + 1.2)) {
                        this.unitCount--; this.scene.remove(u); this.units.splice(k, 1);
                        if(this.unitCount <= 0) this.gameOver();
                    }
                });
            }
        });

        // Gates
        for (let i = this.gates.length - 1; i >= 0; i--) {
            const g = this.gates[i];
            if (Math.abs(g.mesh.position.z - 15) < 3) {
                if (Math.abs(g.mesh.position.x - this.lanes[this.currentLane]) < 4) {
                    if (g.type.op === 'mult') this.unitCount *= g.type.val;
                    else if (g.type.op === 'add') this.unitCount += g.type.val;
                    else if (g.type.op === 'gun') this.gunPower += g.type.val;
                    this.updatePlayerCrowd(); this.scene.remove(g.mesh); this.gates.splice(i, 1);
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.gameState === 'PLAYING') {
            this.distance += 0.2;
            this.moveSpeed = 0.6 + (this.distance / 1500);
            this.spawnEntities();
            this.fireWeapon();
            this.enemyCombat();

            this.enemies.forEach(e => e.mesh.position.z += this.moveSpeed * 1.8);
            this.gates.forEach(g => g.mesh.position.z += this.moveSpeed * 1.5);
            [this.bullets, this.enemyBullets].forEach(arr => {
                arr.forEach((b, i) => { 
                    b.mesh.position.z += b.vz; 
                    if(b.mesh.position.z > 50 || b.mesh.position.z < -300) { this.scene.remove(b.mesh); arr.splice(i, 1); }
                });
            });

            this.enemies = this.enemies.filter(e => { if (e.mesh.position.z > 40) { this.scene.remove(e.mesh); return false; } return true; });
            this.handleCollisions();
        }
        this.renderer.render(this.scene, this.camera);
    }
}
new Game();
