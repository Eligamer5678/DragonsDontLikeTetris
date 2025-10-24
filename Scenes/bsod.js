import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import Color from '../js/Color.js';
import Timer from '../js/Timer.js';
import UIButton from '../js/UI/Button.js';

export class BSODScene extends Scene {
    constructor(...args) {
        super('bsod', ...args);
        this.loaded = 0;
        this.elements = new Map();
        this.tickRate = 42;
    }

    async onPreload(resources=null) {}

    onSwitchTo() {
        this.Draw.clear();
        this.UIDraw.clear();
        return this.packResources();
    }

    packResources() {
        this.dragons.forEach((dragon) => {
            dragon.reset()
        })
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
                case 'dragons': this.dragons = value; break;
                default: console.warn(`Unknown resource key: ${key}`); log = false;
            }
        }
    }

    onReady() {
        this.isReady = true;
        this.createUI();
        this.sessionTimer = new Timer('stopwatch');
        this.sessionTimer.start();
        this.frameCount = 0;
        // Multiplayer sync
        if (this.dragon) this.sendState(this.dragon);
    }

    update(delta) {
        if(!this.isReady) return;
        this.sessionTimer.update(delta);
        this.frameCount += 1;
        if(this.keys.pressed('any') || this.mouse.pressed('any')){
            this.musician.resume();
        }
        if(this.loaded===4){
            this.loaded+=1;
        }
        this.mouse.setMask(0);
        this.mouse.setPower(0);
        let sortedElements = [...this.elements.values()].sort((a, b) => b.layer - a.layer);
        for (let elm of sortedElements){
            elm.update(delta);
        }
        // Multiplayer integration
        if (this.dragon) this.sendState(this.dragon);
    }
    // Multiplayer sync: sendState and applyRemoteState
    sendState(localDragon) {
        if (this.server) {
            if (!this.lastStateSend) this.lastStateSend = 0;
            const now = performance.now();
            if (now - this.lastStateSend >= this.tickRate) {
                const diff = {};
                // Position
                if (localDragon?.pos) {
                    diff[this.playerId + 'x'] = localDragon.pos.x;
                    diff[this.playerId + 'y'] = localDragon.pos.y;
                }
                // Power and health
                diff[this.playerId + 'power'] = localDragon?.power;
                diff[this.playerId + 'health'] = localDragon?.health;
                // Scene info
                diff[this.playerId + 'scene'] = { scene: 'bsod', time: now };
                if (Object.keys(diff).length > 0) {
                    this.server.sendDiff(diff);
                }
                this.lastStateSend = now;
            }
        }
    }

    applyRemoteState(state) {
        if (!state) return;
        const remoteId = this.playerId === 'p1' ? 'p2' : 'p1';
        const ghost = this.dragon && this.dragon.id === remoteId ? this.dragon : null;
        const localDragon = this.dragon && this.dragon.id === this.playerId ? this.dragon : null;
        if (ghost) {
            if (state[remoteId + 'x'] !== undefined) ghost.pos.x = state[remoteId + 'x'];
            if (state[remoteId + 'y'] !== undefined) ghost.pos.y = state[remoteId + 'y'];
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
        if (ghost && state[remoteId + 'health'] !== undefined) {
            ghost.health = Math.max(ghost.health, state[remoteId + 'health']);
        }
        if (localDragon && state[this.playerId + 'health'] !== undefined) {
            localDragon.health = Math.max(localDragon.health, state[this.playerId + 'health']);
        }
        if (state[remoteId + 'scene']) {
            if (state[remoteId + 'scene'].scene !== 'bsod' && this.playerId !== 'p1') {
                this.switchScene(state[remoteId + 'scene'].scene);
            }
        }
    }

    createUI(){
        // Add two buttons that switch to the title scene
        let bsodYesButton = new UIButton(this.mouse,this.keys, new Vector(735, 772), new Vector(95, 45), 1, null, '#FF000000', '#FFFFFF33', '#00000055');
        let bsodNoButton = new UIButton(this.mouse,this.keys, new Vector(850, 772), new Vector(90, 45), 1, null, '#FF000000', '#FFFFFF33', '#00000055');
        bsodYesButton.onPressed.left.connect(() => { this.switchScene('title'); });
        bsodNoButton.onPressed.left.connect(() => { this.switchScene('title'); });
        this.elements.set('bsodYesButton', bsodYesButton);
        this.elements.set('bsodNoButton', bsodNoButton);
    }
    
    draw() {
        if(!this.isReady) return;
        if(!((this.frameCount)%2)){  
            this.UIDraw.rect(new Vector(700,0),new Vector(530,1080),null,true,0,true);
            this.Draw.image(this.BackgroundImages['bsod'],Vector.zero(),new Vector(1920,1080));
        }
        let sortedElements = [...this.elements.values()].sort((a, b) => a.layer - b.layer);
        for (const elm of sortedElements) {
            elm.draw(this.UIDraw);
        }
        this.UIDraw.useCtx('overlays');
        this.UIDraw.clear();
        this.UIDraw.useCtx('UI');
    }
}
