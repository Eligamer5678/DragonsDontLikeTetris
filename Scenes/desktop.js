import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import Color from '../js/Color.js';
import Board from '../Game logic/board.js';
import { Dragon,Appicon,FireBall,Fragment } from '../Game logic/sprites.js';
import Timer from '../js/Timer.js';
import Geometry from '../js/Geometry.js';

export class DesktopScene extends Scene {
    sendState(localDragon) {
        if (this.server) {
            if (!this.lastStateSend) this.lastStateSend = 0;
            const now = performance.now();
            if (now - this.lastStateSend >= this.tickRate) {
                const diff = {};
                // Send positions
                if (localDragon.pos.x !== this.lastSentPos?.[this.playerId]?.x ||
                    localDragon.pos.y !== this.lastSentPos?.[this.playerId]?.y) {
                    diff[this.playerId + 'x'] = localDragon.pos.x;
                    diff[this.playerId + 'y'] = localDragon.pos.y;
                    diff[this.playerId + 'd'] = Math.sign(localDragon.vlos.x);
                    this.lastSentPos = this.lastSentPos || {};
                    this.lastSentPos[this.playerId] = { ...localDragon.pos };
                }
                // Sync power and health
                diff[this.playerId + 'power'] = localDragon.power;
                diff[this.playerId + 'health'] = localDragon.health;
                // Send other data
                diff[this.playerId + 'scene'] = { scene: 'desktop', time: now };
                // Send data
                if (Object.keys(diff).length > 0) {
                    this.server.sendDiff(diff);
                }
                this.lastStateSend = now;
            }
        }
    }

    applyRemoteState = (state) => {
        if (!state) return;
        const remoteId = this.playerId === 'p1' ? 'p2' : 'p1';
        const ghost = this.dragons.find(d => d.id === remoteId);
        const localDragon = this.dragons.find(d => d.id === this.playerId);
        if (ghost) {
            if (state[remoteId + 'x'] !== undefined) ghost.pos.x = state[remoteId + 'x'];
            if (state[remoteId + 'y'] !== undefined) ghost.pos.y = state[remoteId + 'y'];
            if (state[remoteId + 'd'] !== undefined) ghost.vlos.x = 0.0001 * state[remoteId + 'd'];
        }
        // Sync power: both dragons always have the same, take the highest
        let remotePower = state[remoteId + 'power'];
        let localPower = state[this.playerId + 'power'];
        if (ghost && localDragon) {
            let maxPower = Math.max(
                ghost.power,
                localDragon.power,
                remotePower !== undefined ? remotePower : -Infinity,
                localPower !== undefined ? localPower : -Infinity
            );
            ghost.power = maxPower;
            localDragon.power = maxPower;
        }
        // Sync health: each dragon takes the higher of local/remote
        if (state[remoteId + 'health'] !== undefined) {
            this.remoteHealth = Math.max(this.remoteHealth ?? ghost?.health ?? 0, state[remoteId + 'health']);
        }
        // Re-search for remote dragon instance after health update
        const updatedGhost = this.dragons.find(d => d.id === remoteId);
        if (updatedGhost) updatedGhost.health = this.remoteHealth ?? updatedGhost.health;
        if (localDragon && state[this.playerId + 'health'] !== undefined) {
            localDragon.health = Math.max(localDragon.health, state[this.playerId + 'health']);
        }
        if (state[remoteId + 'scene']) {
            if (state[remoteId + 'scene'].scene !== 'desktop' && this.playerId !== 'p1') {
                this.switchScene(state[remoteId + 'scene'].scene);
            }
        }
    }
    constructor(...args) {
        super('desktop', ...args);
        this.loaded = 0;
        this.elements = new Map();
        this.tickCount = 0;
        this.tickRate = 42; // 24 fps
        this.tickAccumulator = 0;
        this.syncStep = 0;
    }

    async onPreload(resources = null) {
        // ...existing code...
    }
    onSwitchTo() {
        this.resetDesktop();
        this.disconnectDebug();
        this.Draw.clear();
        this.UIDraw.clear();
        return this.packResources();
    }

    packResources() {
        let resources = new Map();
        resources.set('settings', this.settings);
        resources.set('backgrounds', this.BackgroundImages);
        resources.set('sprites', this.SpriteImages);
        resources.set('soundguy', this.soundGuy);
        resources.set('musician', this.musician);
        resources.set('conductor', this.conductor);
        resources.set('narrator', this.narrator);
        resources.set('pause', this.elements.get('pause'));
        resources.set('settings-button', this.elements.get('settings-button'));
        resources.set('dragons', this.dragons);
        resources.set('id', this.playerId);
        return resources;
    }

    unpackResources(resources) {
        if (!resources) {
            console.log('No resources...');
            return false;
        }
        if (!(resources instanceof Map)) {
            console.error('Invalid resources type');
            return false;
        }
        for (const [key, value] of resources.entries()) {
            switch (key) {
                case 'settings': this.settings = value; break;
                case 'backgrounds': this.BackgroundImages = value; break;
                case 'sprites': this.SpriteImages = value; break;
                case 'soundguy': this.soundGuy = value; break;
                case 'musician': this.musician = value; break;
                case 'conductor': this.conductor = value; break;
                case 'narrator': this.narrator = value; break;
                case 'dragons': this.dragons = value; break;
                case 'settings-button': this.elements.set('settings-button', value); break;
                case 'pause': this.elements.set('pause', value); break;
                case 'id': this.playerId = value; break;
                default: console.warn(`Unknown resource key: ${key}`);
            }
        }
        return true;
    }

    onSwitchFrom(resources) {
        if (!this.unpackResources(resources)) return false;
        if (this.RSS) {
            this.RSS.connect((state) => { this.applyRemoteState(state); });
        }
    }


    onReady() {
        this.isReady = true;
        this.createUI();
        this.createTimers();
        this.frameCount = 0;
        this.soundsPlayed = 0;
        this.createParticles();
        this.deaths = 0;
        this.aiScore = 0;
        this.resets = 0;
        this.sessionBlocks = 0;
        this.paused = false;
        this.lineMessages = [];
        this.playerCount = this.saver.get('twoPlayer', true) ? 2 : 1;
        this.dragonsLeft = this.playerCount;
        this.reviveDragons = false;
        this.dragons.forEach(dragon => {
            dragon.reset(new Vector(1920 / 2, 1080 / 2));
            dragon.health = this.playerCount === 2 ? 50 : 100;
            dragon.onDeath.connect(() => { this.dragonsLeft -= 1; });
            dragon.megaability.connect(() => { this.reviveDragons = true; });
        });
        this.connectDebug();
        this.setConditions && this.setConditions();
        this.setMods && this.setMods();
        this.createIcons();
        // Multiplayer sync
        const localDragon = this.dragons.find(d => d.id === this.playerId);
        if (localDragon) this.sendState && this.sendState(localDragon);
    }

    update(delta) {
        if (!this.isReady) return;
        this.tickAccumulator += delta * 1000;
        while (this.tickAccumulator >= this.tickRate) {
            if (!this.paused) {
                this.tick();
            }
            this.tickAccumulator -= this.tickRate;
        }
        this.frameCount += 1;
        this.draw();
    }

    tick() {
        this.tickCount++;
        const tickDelta = this.tickRate / 1000;
        this.updateTimers && this.updateTimers(tickDelta);
        // Dragon updates
        if (this.saver.get('modifiers/modifier5', false)) {
            this.dragons.forEach(dragon => {
                dragon.health += dragon.power * tickDelta / 10;
                if (dragon.health > dragon.power * 10) dragon.health = dragon.power * 10;
            });
        }
        if (this.reviveDragons) {
            this.dragons.forEach(dragon => {
                if (dragon.died) {
                    dragon.died = false;
                    dragon.reset(new Vector(1920 / 2, 1080 / 2));
                }
            });
            this.reviveDragons = false;
        }
        this.dragons.forEach(dragon => dragon.update(tickDelta));
        this.updateParticles && this.updateParticles(tickDelta);
        // Update icons and check fireball collisions
        for (let icon of this.icons) {
            icon.update(tickDelta);
        }
        this.dragons.forEach(dragon => {
            for (let fireball of dragon.fireballs) {
                for (let icon of this.icons) {
                    if (Geometry.rectCollide(fireball.pos, fireball.size, icon.pos, icon.size)) {
                        icon.health -= fireball.power * 10;
                        this.soundGuy.play('fireball');
                        if (icon.health <= 0) {
                            this.soundGuy.play('break');
                            icon.adiós();
                        }
                        fireball.adiós('hit icon');
                    }
                }
            }
        });
        // Check for all icons destroyed
        if (this.icons.length === 0) {
            this.switchScene('bsod');
        }
        // Multiplayer state sync
        const localDragon = this.dragons.find(d => d.id === this.playerId);
        if (localDragon) this.sendState(localDragon);
    }

    createUI() {
        // ...existing code...
    }

    createTimers() {
        this.sessionTimer = new Timer('stopwatch');
        this.sessionTimer.start();
        // Add more timers if needed for parity
    }

    createParticles() {
        this.particles = [];
        this.particleTimer = new Timer('loop', 0.05);
        this.particleTimer.onLoop.connect(() => {
            if (this.particles.length < 40) {
                let pos = new Vector(Math.random() * 1920, Math.random() * 1080);
                let vel = new Vector((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
                let size = 4 + Math.random() * 8;
                let color = new Color(Math.random(), Math.random(), Math.random(), 1);
                this.particles.push(new Particle(this.Draw, pos, vel, size, color));
            }
        });
        this.particleTimer.start();
    }

    updateParticles(delta) {
        for (let p of this.particles) p.update(delta);
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].isAlive()) {
                let pos = new Vector(Math.random() * 1920, Math.random() * 1080);
                let vel = new Vector((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
                let size = 4 + Math.random() * 8;
                let color = new Color(Math.random(), Math.random(), Math.random(), 1);
                this.particles[i] = new Particle(this.Draw, pos, vel, size, color);
            }
        }
    }

    createIcons() {
        this.icons = [];
        const iconImages = [];
        for (let i = 0; i < 10; i++) {
            let img = new Image();
            img.src = `Assets/desktop icons/DesktopIcon (${i}).png`;
            iconImages.push(img);
        }
        const iconSize = new Vector(128, 128);
        const xCount = Math.floor(1920 / iconSize.x);
        const yCount = Math.floor(1080 / iconSize.y);
        let iconIndex = 0;
        for (let y = 0; y < yCount; y++) {
            for (let x = 0; x < xCount; x++) {
                let px = x * iconSize.x + (iconSize.x / 2);
                let py = y * iconSize.y + (iconSize.y / 2);
                let img = iconImages[iconIndex % iconImages.length];
                let icon = new Appicon(this.Draw, new Vector(px, py), iconSize, img);
                icon.health = 100;
                icon.destroy.connect(() => {
                    this.icons = this.icons.filter(ic => ic !== icon);
                    this.dragons.forEach(dragon => {
                        dragon.power += 0.2;
                    });
                });
                this.icons.push(icon);
                iconIndex++;
            }
        }
    }

    resetDesktop() {
        this.dragons.forEach(dragon => {
            dragon.died = false;
            dragon.reset(new Vector(1920 / 2, 1080 / 2));
        });
        this.sessionTimer && this.sessionTimer.reset();
        this.deaths = 0;
        this.aiScore = 0;
        this.lineMessages = [];
        this.resets = 0;
        this.sessionBlocks = 0;
    }

    connectDebug() {
        window.Debug && window.Debug.createSignal('setPower', e => { this.dragons[0].power = e; });
        window.Debug && window.Debug.createSignal('killDragon', () => { this.dragons[0].health = 0; });
        window.Debug && window.Debug.createSignal('pause', () => { this.pause(); });
        window.Debug && window.Debug.createSignal('unpause', () => { this.unpause(); });
    }

    disconnectDebug() {
        window.Debug && window.Debug.disconnectSignal('setPower');
        window.Debug && window.Debug.disconnectSignal('killDragon');
        window.Debug && window.Debug.disconnectSignal('pause');
        window.Debug && window.Debug.disconnectSignal('unpause');
    }
    
    draw() {
        if (!this.isReady) return;
        if (!((this.frameCount) % 2)) {
            this.UIDraw.rect(new Vector(700, 0), new Vector(530, 1080), null, true, 0, true);
            this.Draw.image(this.BackgroundImages['desktop'], Vector.zero(), new Vector(1920, 1080));
            this.Draw.text(Math.round(this.sessionTimer.getTime() * 100) / 100, new Vector(1920 / 2, 1080 / 2), this.settings.colors.timer, 1, 100, { 'align': 'center', 'baseline': 'middle' });
            for (let p of this.particles) p.draw();
            this.icons.forEach(icon => icon.draw());
        }
        let sortedElements = [...this.elements.values()].sort((a, b) => a.layer - b.layer);
        for (const elm of sortedElements) {
            elm.draw(this.UIDraw);
        }
        this.UIDraw.useCtx('overlays');
        this.UIDraw.clear();
        this.dragons.forEach(dragon => {
            dragon.draw();
        });
        this.UIDraw.useCtx('UI');
    }

    
}
