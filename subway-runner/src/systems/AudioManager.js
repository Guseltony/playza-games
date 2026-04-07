// Audio Manager - Handles background music and sound effects
export class AudioManager {
    constructor(engine) {
        this.engine = engine;
        
        this.context = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        this.buffers = {};
        this.currentMusic = null;
        this.musicPlaying = false;
        
        this.biomeMusic = {
            railway: { freq: 220, type: 'sawtooth' },
            road: { freq: 330, type: 'sine' },
            bridge: { freq: 440, type: 'triangle' },
            air: { freq: 550, type: 'sine' },
            snow: { freq: 294, type: 'triangle' }
        };
        
        this.currentBiome = 'road';
    }
    
    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.context.destination);
            
            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.context.destination);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    async playMusic() {
        await this.init();
        
        if (!this.context) return;
        
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        
        this.musicPlaying = true;
        this.startBiomeMusic(this.currentBiome);
    }
    
    startBiomeMusic(biome) {
        if (!this.context || !this.musicPlaying) return;
        
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
        
        const music = this.biomeMusic[biome] || this.biomeMusic.road;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = music.type;
        osc.frequency.value = music.freq;
        
        gain.gain.value = 0.15;
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start();
        
        this.currentMusic = osc;
        this.currentBiome = biome;
    }
    
    playJump() {
        this.playTone(400, 0.1, 'sine', 0.3);
    }
    
    playSlide() {
        this.playTone(200, 0.15, 'sawtooth', 0.2);
    }
    
    playWhoosh() {
        this.playNoise(0.08, 0.3);
    }
    
    playCoin() {
        this.playTone(880, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(1100, 0.1, 'sine', 0.3), 50);
    }
    
    playPowerUp() {
        this.playTone(523, 0.15, 'sine', 0.4);
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.4), 100);
        setTimeout(() => this.playTone(784, 0.2, 'sine', 0.4), 200);
    }
    
    playShield() {
        this.playTone(440, 0.2, 'square', 0.3);
    }
    
    playCrash() {
        this.playNoise(0.5, 0.6);
        this.playTone(100, 0.3, 'sawtooth', 0.5);
    }
    
    playNearMiss() {
        this.playTone(660, 0.05, 'square', 0.2);
    }
    
    playTone(freq, duration, type = 'sine', volume = 0.3) {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.context.currentTime + duration);
    }
    
    playNoise(duration, volume = 0.3) {
        if (!this.context) return;
        
        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        source.connect(gain);
        gain.connect(this.sfxGain);
        
        source.start();
    }
    
    setBiome(biome) {
        if (biome !== this.currentBiome) {
            this.startBiomeMusic(biome);
        }
    }
    
    stop() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
        this.musicPlaying = false;
    }
    
    reset() {
        this.stop();
        this.currentBiome = 'road';
    }
}
