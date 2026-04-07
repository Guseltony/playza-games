// Core Game Engine - Main game loop and state management
import * as THREE from 'three';
import { PlayerController } from '../player/PlayerController.js';
import { ProceduralGenerator } from '../systems/ProceduralGenerator.js';
import { EnvironmentManager } from '../systems/EnvironmentManager.js';
import { ObstacleSystem } from '../systems/ObstacleSystem.js';
import { PowerUpSystem } from '../systems/PowerUpSystem.js';
import { ScoringSystem } from '../systems/ScoringSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { AudioManager } from '../systems/AudioManager.js';
import { EffectSystem } from '../systems/EffectSystem.js';
import { UIManager } from '../ui/UIManager.js';

export class GameEngine {
    constructor(container) {
        this.container = container;
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.gameTime = 0;
        
        this.config = {
            baseSpeed: 15,
            maxSpeed: 45,
            acceleration: 0.5,
            laneWidth: 3,
            laneCount: 3,
            gravity: 30,
            jumpForce: 12,
            slideDuration: 0.6,
            laneSwitchDuration: 0.15
        };
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        this.setupSystems();
        this.setupEventListeners();
        this.resize();
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 150);
        this.scene.background = new THREE.Color(0x87ceeb);
        
        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            500
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 2, 0);
    }
    
    setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        
        const directional = new THREE.DirectionalLight(0xffffff, 1);
        directional.position.set(10, 20, 10);
        directional.castShadow = true;
        directional.shadow.mapSize.width = 2048;
        directional.shadow.mapSize.height = 2048;
        directional.shadow.camera.near = 0.5;
        directional.shadow.camera.far = 100;
        directional.shadow.camera.left = -30;
        directional.shadow.camera.right = 30;
        directional.shadow.camera.top = 30;
        directional.shadow.camera.bottom = -30;
        this.scene.add(directional);
        
        const hemi = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.4);
        this.scene.add(hemi);
    }
    
    setupSystems() {
        this.player = new PlayerController(this);
        this.generator = new ProceduralGenerator(this);
        this.environment = new EnvironmentManager(this);
        this.obstacles = new ObstacleSystem(this);
        this.powerups = new PowerUpSystem(this);
        this.scoring = new ScoringSystem(this);
        this.cameraSystem = new CameraSystem(this);
        this.audio = new AudioManager(this);
        this.effects = new EffectSystem(this);
        this.ui = new UIManager(this);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        this.keyDownHandler = (e) => this.handleKeyDown(e);
        this.keyUpHandler = (e) => this.handleKeyUp(e);
        this.touchStartHandler = (e) => this.handleTouchStart(e);
        this.touchEndHandler = (e) => this.handleTouchEnd(e);
        
        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);
        window.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        window.addEventListener('touchend', this.touchEndHandler);
    }
    
    handleKeyDown(e) {
        if (!this.isRunning || this.isPaused || this.gameOver) return;
        
        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.player.moveLeft();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.player.moveRight();
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                this.player.jump();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.player.slide();
                break;
        }
    }
    
    handleKeyUp(e) {
        switch(e.code) {
            case 'ArrowDown':
            case 'KeyS':
                this.player.stopSlide();
                break;
        }
    }
    
    handleTouchStart(e) {
        if (!this.isRunning || this.isPaused || this.gameOver) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStarted = true;
    }
    
    handleTouchEnd(e) {
        if (!this.touchStarted || !this.isRunning || this.isPaused || this.gameOver) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < -30) this.player.moveLeft();
            else if (deltaX > 30) this.player.moveRight();
        } else {
            if (deltaY < -30) this.player.jump();
            else if (deltaY > 30) this.player.slide();
        }
        
        this.touchStarted = false;
    }
    
    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.gameOver = false;
        this.elapsedTime = 0;
        this.gameTime = 0;
        
        this.player.reset();
        this.generator.reset();
        this.environment.reset();
        this.obstacles.reset();
        this.powerups.reset();
        this.scoring.reset();
        this.effects.reset();
        
        this.ui.showGame();
        this.audio.playMusic();
        
        this.clock = new THREE.Clock();
        this.animate();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        this.deltaTime = Math.min(this.clock.getDelta(), 0.05);
        this.elapsedTime += this.deltaTime;
        this.gameTime += this.deltaTime;
        
        if (!this.isPaused && !this.gameOver) {
            this.update();
        }
        
        this.render();
    }
    
    update() {
        const speedMultiplier = 1 + (this.gameTime / 60) * 0.3;
        this.currentSpeed = Math.min(
            this.config.baseSpeed * speedMultiplier,
            this.config.maxSpeed
        );
        
        this.player.update(this.deltaTime);
        this.environment.update(this.deltaTime);
        this.obstacles.update(this.deltaTime);
        this.powerups.update(this.deltaTime);
        this.scoring.update(this.deltaTime);
        this.cameraSystem.update(this.deltaTime);
        this.effects.update(this.deltaTime);
        this.generator.update(this.deltaTime);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    gameOver() {
        this.gameOver = true;
        this.isRunning = false;
        
        this.audio.playCrash();
        this.ui.showGameOver(this.scoring.getScoreData());
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        this.ui.showPause(this.isPaused);
    }
    
    destroy() {
        this.isRunning = false;
        
        window.removeEventListener('resize', () => this.resize());
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        window.removeEventListener('touchstart', this.touchStartHandler);
        window.removeEventListener('touchend', this.touchEndHandler);
        
        this.renderer.dispose();
        this.scene.clear();
    }
}
