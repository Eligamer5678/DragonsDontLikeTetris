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
        this.dragon.update(delta);
        this.mouse.setMask(0);
        this.mouse.setPower(0);
        let sortedElements = [...this.elements.values()].sort((a, b) => b.layer - a.layer);
        for (let elm of sortedElements){
            elm.update(delta);
            let collision = Geometry.spriteToTile(this.dragon.pos.clone(), this.dragon.vlos.clone(), this.dragon.size, elm.pos, elm.size);
            if (collision) {
                this.dragon.pos = collision.pos;
                this.dragon.vlos = collision.vlos;
            }
        }

        // --- Fireball -> UIButton interaction ---
        // If the dragon exists and has fireballs, check each fireball against each UIButton
        if(this.deleteFireballs){
            this.dragon.fireballs = [];
        }
        if (this.dragon && this.dragon.fireballs.length > 0) {
            // Copy arrays to avoid mutation while iterating
            const fires = this.dragon.fireballs.slice();
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

        // === Rect Placement Tool (advanced) ===
        if (!this._rectTool) {
            this._rectTool = {
                active: false,
                start: null,
                end: null,
                dragging: false,
                rects: [], // array of [x1, y1, x2, y2]
                preview: null,
                selected: null,
                moving: false,
                moveStart: null
            };
        }
        // Activate tool on pressing ']'
        if (this.keys.pressed(']')) {
            this._rectTool.active = !this._rectTool.active;
            if (this._rectTool.active) {
                console.log('Rect tool activated. Click+drag, space to create, select, g to move, x to delete.');
            } else {
                this._rectTool.dragging = false;
                this._rectTool.start = null;
                this._rectTool.end = null;
                this._rectTool.preview = null;
                this._rectTool.selected = null;
                this._rectTool.moving = false;
                this._rectTool.rects = [];
                this.mouse.releaseGrab();
                console.log('Rect tool deactivated.');
            }
        }
        if (this._rectTool.active) {
            // Start grab on left press (for preview)
            if (this.mouse.pressed('left') && !this._rectTool.dragging && !this._rectTool.moving) {
                this._rectTool.start = this.mouse.pos.clone();
                this.mouse.grab(this._rectTool.start);
                this._rectTool.dragging = true;
                this._rectTool.preview = null;
            }
            // End grab on left release (for preview)
            if (this._rectTool.dragging && this.mouse.released('left')) {
                this._rectTool.end = this.mouse.pos.clone();
                this.mouse.releaseGrab();
                this._rectTool.dragging = false;
                // Store preview
                this._rectTool.preview = [
                    Math.round(this._rectTool.start.x),
                    Math.round(this._rectTool.start.y),
                    Math.round(this._rectTool.end.x),
                    Math.round(this._rectTool.end.y)
                ];
            }

            // Create rect on space
            if (this._rectTool.preview && this.keys.pressed(' ')) {
                this._rectTool.rects.push([...this._rectTool.preview]);
                console.log('Placed rect:', this._rectTool.preview);
                this._rectTool.preview = null;
            }

            // Select rect by clicking inside
            if (this.mouse.pressed('left') && !this._rectTool.dragging && !this._rectTool.moving) {
                const m = this.mouse.pos;
                let found = null;
                for (let i = 0; i < this._rectTool.rects.length; ++i) {
                    const r = this._rectTool.rects[i];
                    const x1 = Math.min(r[0], r[2]), x2 = Math.max(r[0], r[2]);
                    const y1 = Math.min(r[1], r[3]), y2 = Math.max(r[1], r[3]);
                    if (m.x >= x1 && m.x <= x2 && m.y >= y1 && m.y <= y2) {
                        found = i;
                        break;
                    }
                }
                this._rectTool.selected = found;
            }

            // Move selected rect with 'g' (using Mouse grab system)
            if (this._rectTool.selected !== null) {
                // Start move only when 'g' is pressed and not already moving
                if (this.keys.pressed('g') && !this._rectTool.moving) {
                    this._rectTool.moving = true;
                    this.mouse.grab(this.mouse.pos.clone());
                    console.log('Moving rect:');
                }
                // Move while 'g' is held
                if (this._rectTool.moving && this.keys.held('g')) {
                    const idx = this._rectTool.selected;
                    if (idx !== null) {
                        const rect = this._rectTool.rects[idx];
                        const delta = this.mouse.getGrabDelta();
                        rect[0] += Math.round(delta.x);
                        rect[1] += Math.round(delta.y);
                        rect[2] += Math.round(delta.x);
                        rect[3] += Math.round(delta.y);
                        this.mouse.grab(this.mouse.pos.clone());
                        console.log('MOVE');
                    }
                }
                // End move when 'g' is released
                if (this._rectTool.moving && !this.keys.held('g')) {
                    this._rectTool.moving = false;
                    this.mouse.releaseGrab();
                }
            }

            // Delete selected rect with 'x'
            if (this._rectTool.selected !== null && this.keys.pressed('x')) {
                this._rectTool.rects.splice(this._rectTool.selected, 1);
                this._rectTool.selected = null;
                this._rectTool.moving = false;
            }
        }
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
        if (this._rectTool && this._rectTool.active) {
            // Preview while dragging
            if (this._rectTool.dragging && this._rectTool.start) {
                const start = this._rectTool.start;
                const end = this.mouse.pos;
                const topLeft = new Vector(Math.min(start.x, end.x), Math.min(start.y, end.y));
                const size = new Vector(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
                this.UIDraw.rect(topLeft, size, '#00FF00');
            }
            // Preview after drag
            if (this._rectTool.preview) {
                const r = this._rectTool.preview;
                const topLeft = new Vector(Math.min(r[0], r[2]), Math.min(r[1], r[3]));
                const size = new Vector(Math.abs(r[2] - r[0]), Math.abs(r[3] - r[1]));
                this.UIDraw.rect(topLeft, size, '#00FF88');
            }
            // Draw all placed rects
            for (let i = 0; i < this._rectTool.rects.length; ++i) {
                const r = this._rectTool.rects[i];
                const topLeft = new Vector(Math.min(r[0], r[2]), Math.min(r[1], r[3]));
                const size = new Vector(Math.abs(r[2] - r[0]), Math.abs(r[3] - r[1]));
                const color = (i === this._rectTool.selected) ? '#FF00FF' : '#00FF00';
                this.UIDraw.rect(topLeft, size, color);
            }
        }
        this.dragon.draw()
        this.UIDraw.useCtx('UI');

        // Draw rect tool preview (while dragging)
    }
}
