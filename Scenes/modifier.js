import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import Color from '../js/Color.js';
import Timer from '../js/Timer.js';
import UIButton from '../js/UI/Button.js';
import Geometry from '../js/Geometry.js';

export class modifierScene extends Scene {
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
            let log = true;
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
        this.deleteFireballs = false;
        this.cooldownTimer = new Timer('loop', 0.25);
        this.cooldownTimer.onLoop.connect(() => this.deleteFireballs = false);
        this.cooldownTimer.start();
    }

    update(delta) {
        this.cooldownTimer.update(delta);
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
            this.dragons.forEach((dragon)=>{
                let collision = Geometry.spriteToTile(dragon.pos.clone(), dragon.vlos.clone(), dragon.size, elm.pos, elm.size);
                if (collision) {
                    dragon.pos = collision.pos;
                    dragon.vlos = collision.vlos;
                }
            })
        }
        this.dragons.forEach((dragon)=>{
            dragon.update(delta);

            // --- Fireball -> UIButton interaction ---
            // If the dragon exists and has fireballs, check each fireball against each UIButton
            if(this.deleteFireballs){
                dragon.fireballs = [];
            }
            if (dragon && dragon.fireballs.length > 0) {
                // Copy arrays to avoid mutation while iterating
                const fires = dragon.fireballs.slice();
                // Build a list of UIButton targets. Exclude the pause container itself (key === 'pause'),
                // but include any child buttons the pause container may hold.
                const buttons = [];
                for (const [key, el] of this.elements.entries()) {
                    if (el && typeof el.onPressed === 'object' && el.visible !== false) buttons.push(el);
                }

                for (let fire of fires) {
                    for (let btn of buttons) {
                        // btn.pos and btn.size exist on UIButton
                        if (Geometry.rectCollide(fire.pos.sub(fire.size.mult(0.5)), fire.size, btn.pos.add(btn.offset || {x:0,y:0}), btn.size)) {
                            try {
                                // Emit a left-press on the button so toggle behavior runs
                                btn.onPressed.left.emit();
                            } catch (e) {
                                // Fallback: toggle trigger state
                                if (btn.trigger) {
                                    btn.triggered = !btn.triggered;
                                    btn.onTrigger.emit(btn.triggered);
                                }
                            }
                            this.deleteFireballs = true;
                            
                            // Destroy the fireball so it can't trigger multiple buttons
                            try { fire.adiós(); } catch (e) { if (fire.destroy) fire.destroy.emit(fire); }

                            // Provide a quick visual feedback: pulse the baseColor
                            if (btn.baseColor) {
                                const orig = btn.baseColor;
                                btn.baseColor = '#FFFFFF44';
                                // restore after a short timeout using a minimal timer approach
                                setTimeout(() => { btn.baseColor = orig; }, 120);
                            }

                            // Break to next fireball after a hit
                            break;
                        }
                    }
                }
            }
        })

    }

    createUI(){
        const mod1 = new UIButton(this.mouse, this.keys, new Vector(97, 294), new Vector(533, 305), 1, null, '#FF000000', '#FFFFFF33', '#00000055');
        const mod2 = new UIButton(this.mouse, this.keys, new Vector(692, 294), new Vector(537, 305), 1, null, '#FF000000', '#FFFFFF33', '#00000055');
        const mod3 = new UIButton(this.mouse, this.keys, new Vector(1290, 294), new Vector(534, 304), 1, null, '#FF000000', '#FFFFFF33', '#00000055');
        const mod4 = new UIButton(this.mouse, this.keys, new Vector(94, 660), new Vector(533, 329), 1, null, '#FF000000', '#FFFFFF33', '#00000055');
        const mod5 = new UIButton(this.mouse, this.keys, new Vector(690, 660), new Vector(533, 329), 1, null, '#FF000000', '#FFFFFF33', '#00000055');
        const mod6 = new UIButton(this.mouse, this.keys, new Vector(1288, 661), new Vector(531, 329), 1, null, '#FF000000', '#FFFFFF33', '#00000055');
        mod1.onTrigger.connect((state) => {
            mod1.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier1', state);
        });
        mod2.onTrigger.connect((state) => {
            mod2.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier2', state);
        });
        mod3.onTrigger.connect((state) => {
            mod3.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier3', state);   
        });
        mod4.onTrigger.connect((state) => {
            mod4.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier4', state);
        });
        mod5.onTrigger.connect((state) => {
            mod5.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier5', state);
        });
        mod6.onTrigger.connect((state) => {
            mod6.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier6', state);
        });
        mod1.trigger = true;
        mod2.trigger = true;
        mod3.trigger = true;
        mod4.trigger = true;
        mod5.trigger = true;
        mod6.trigger = true;
        this.elements.set('mod1', mod1);
        this.elements.set('mod2', mod2);
        this.elements.set('mod3', mod3);
        this.elements.set('mod4', mod4);
        this.elements.set('mod5', mod5);
        this.elements.set('mod6', mod6);

        // Back button
        const backBtn = new UIButton(this.mouse, this.keys, new Vector(234, 81), new Vector(240, 122), 1, 'Back', '#FF000000', '#FFFFFF33', '#00000055');
        backBtn.onPressed.left.connect(() => { this.switchScene('title'); });
        this.elements.set('backButton', backBtn);
    }
    
    draw() {
        if(!this.isReady) return;
        if(!((this.frameCount)%2)){
            this.UIDraw.rect(new Vector(0,0),new Vector(1920,1080),null,true,0,true);
            this.Draw.image(this.BackgroundImages['modifiers'],Vector.zero(),new Vector(1920,1080));
            this.UIDraw.clear();
            let sortedElements = [...this.elements.values()].sort((a, b) => a.layer - b.layer);
            for (const elm of sortedElements) {
                elm.draw(this.UIDraw);
                
            }
        }
        this.UIDraw.useCtx('overlays');
        this.UIDraw.clear();
        // Draw preview rect (while dragging or after drag)
        this.dragons.forEach((dragon)=>{
            dragon.draw()
        })
        this.UIDraw.useCtx('UI');
    }
}