import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import Color from '../js/Color.js';
import Timer from '../js/Timer.js';
import UIButton from '../js/UI/Button.js';

export class BSODScene extends Scene {
    constructor(Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene) {
        super('bsod', Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene);
        this.loaded = 0;
        this.elements = new Map();
    }

    async onPreload(resources=null) {}

    onSwitchTo() {
        this.Draw.clear();
        this.UIDraw.clear();
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
        return resources;
    }

    onSwitchFrom(resources) {
        if (!resources) {
            console.error('No resources...');
            return;
        }
        if (!(resources instanceof Map)) {
            console.error('Invalid resources type');
            return;
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
                case 'settings-button': this.elements.set('settings-button', value); break;
                case 'pause': this.elements.set('pause', value); break;
                case 'dragon': this.dragon = value; break;
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
