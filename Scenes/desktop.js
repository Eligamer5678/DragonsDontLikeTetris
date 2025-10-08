import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import Color from '../js/Color.js';
import { Dragon,Appicon,FireBall,Fragment } from '../Game logic/sprites.js';
import Timer from '../js/Timer.js';
import Geometry from '../js/Geometry.js';

export class DesktopScene extends Scene {
    
    constructor(Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene) {
        super('desktop', Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene);
        this.loaded = 0;
        this.elements = new Map()
    }
    
    async onPreload(resources=null) {

    }
    onSwitchTo() {
        // Disconnect debug signals when switching out of this scene
        this.dragons.forEach((dragon)=>{
            dragon.reset(new Vector(1920/2,1080/2));
        })
        this.sessionTimer.reset();
        this.deaths = 0;
        this.aiScore = 0;
        this.lineMessages = [];
        this.resets = 0;
        this.sessionBlocks = 0;

        this.Draw.clear()
        this.UIDraw.clear()
        let resources = new Map();
        resources.set('settings', this.settings)
        resources.set('backgrounds',this.BackgroundImages)
        resources.set('sprites',this.SpriteImages)
        resources.set('soundguy',this.soundGuy)
        resources.set('musician',this.musician)
        resources.set('conductor',this.conductor)
        resources.set('narrator',this.narrator)
        resources.set('pause',this.elements.get('pause'))
        resources.set('settings-button',this.elements.get('settings-button'))
        resources.set('dragon',this.dragons[0])
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
            let log = true;
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
                default: console.warn(`Unknown resource key: ${key}`); log = false;
            }
            if (log) console.log(`Loaded: ${key}`);
        }
    }


    onReady() {
        this.isReady = true;
        this.createUI();
        this.sessionTimer = new Timer('stopwatch');
        this.sessionTimer.start();
        this.frameCount = 0;

        // Generate Appicon sprites to fill the desktop
        this.icons = [];
        const iconImages = [];
        for (let i = 0; i < 10; i++) {
            let img = new Image();
            img.src = `Assets/desktop icons/DesktopIcon (${i}).png`;
            iconImages.push(img);
        }
        // Fill desktop with icons, cycling through images
        const iconSize = new Vector(128, 128);
        const xCount = Math.floor(1920 / iconSize.x);
        const yCount = Math.floor(1080 / iconSize.y);
        let iconIndex = 0;
        for (let y = 0; y < yCount; y++) {
            if(y>1){
                // Skip row 5 for taskbar
                continue;
            }
            for (let x = 0; x < xCount; x++) {
                let px = x * iconSize.x + (iconSize.x / 2);
                let py = y * iconSize.y + (iconSize.y / 2);
                let img = iconImages[iconIndex % iconImages.length];
                let icon = new Appicon(this.Draw, new Vector(px, py), iconSize, img);
                icon.health = 100;
                icon.destroy.connect(() => {
                    this.icons = this.icons.filter(ic => ic !== icon);
                    this.dragons.forEach((dragon)=>{
                        dragon.power += 0.2;
                    })
                    if (this.icons.length === 0) {
                        console.log('All desktop icons deleted!');
                        this.switchScene('bsod');
                    }
                });
                this.icons.push(icon);
                iconIndex++;
            }
        }
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
        this.dragons.forEach((dragon)=>{
            dragon.update(delta);
        })
        this.mouse.setMask(0);
        this.mouse.setPower(0);

        // Update icons and check fireball collisions
        for (let icon of this.icons) {
            icon.update(delta);
        }
        // Check fireball collisions with icons
        this.dragons.forEach((dragon)=>{
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
        })

        let sortedElements = [...this.elements.values()].sort((a, b) => b.layer - a.layer);
        for (let elm of sortedElements){
            elm.update(delta);
        }
    }

    createUI(){
        

    }
    
    draw() {
        if(!this.isReady) return;
        if(!((this.frameCount)%2)){
            this.UIDraw.rect(new Vector(700,0),new Vector(530,1080),null,true,0,true);
            this.Draw.image(this.BackgroundImages['desktop'],Vector.zero(),new Vector(1920,1080))
            this.Draw.text(Math.round(this.sessionTimer.getTime()*100)/100,new Vector(1920/2,1080/2),this.settings.colors.timer,1,100,{'align':'center','baseline':'middle'})
            this.icons.forEach(icon => icon.draw());
        }

        let sortedElements = [...this.elements.values()].sort((a, b) => a.layer - b.layer);
        for (const elm of sortedElements) {
            elm.draw(this.UIDraw);
        }
        this.UIDraw.useCtx('overlays')
        this.UIDraw.clear()
        this.dragons.forEach((dragon)=>{
            dragon.draw()
        })
        this.UIDraw.useCtx('UI')
    }

    
}
