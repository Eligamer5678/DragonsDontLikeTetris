import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import Color from '../js/Color.js';
import Timer from '../js/Timer.js';
import UIButton from '../js/UI/Button.js';
import Geometry from '../js/Geometry.js';

export class multimodifierScene extends Scene {
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
        resources.set('dragons',this.dragons)
        resources.set('pause', this.elements.get('pause'));
        resources.set('settings-button', this.elements.get('settings-button'));
        return resources;
    }

    onSwitchFrom(resources) {
        if (!resources) {
            console.log('No resources...');
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
        this.dragonsOnButton = 0
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
        this.dragonsOnButton = 0;
        this.dragons.forEach((dragon)=>{
            dragon.update(delta);
            if(this.deleteFireballs){
                dragon.fireballs = [];
            }
            if(this.saver.get('twoPlayer')===false){
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
            }
            if(dragon.pos.x<50&&dragon.pos.y>1030) this.dragonsOnButton+=1;
        })
        if(this.dragonsOnButton >=2){
            this.switchScene('modifier')
        }
        this.tugOfWar()

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
            this.saver.set('modifiers/modifier7', state);
        });
        mod2.onTrigger.connect((state) => {
            mod2.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier8', state);
        });
        mod3.onTrigger.connect((state) => {
            mod3.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier9', state);   
        });
        mod4.onTrigger.connect((state) => {
            mod4.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier10', state);
        });
        mod5.onTrigger.connect((state) => {
            mod5.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier11', state);
        });
        mod6.onTrigger.connect((state) => {
            mod6.baseColor = state ? '#FF006600' : '#FF000000';
            this.saver.set('modifiers/modifier12', state);
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
            this.Draw.image(this.BackgroundImages['multi-modifiers'],Vector.zero(),new Vector(1920,1080));
            this.UIDraw.clear();
            this.UIDraw.text(`${this.dragonsOnButton}/2`,new Vector(15,1030),'#FFFFFF')
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
        this.drawRope()
        this.UIDraw.useCtx('UI');
    }

    // Tug of War rope simulation
    tugOfWar() {
        // Only run if there are at least 2 dragons
        if (!this.dragons || this.dragons.length < 2) return;
        if (!this.rope) {
            // Initialize rope: 10 vertices between dragons
            const dragonA = this.dragons[0];
            const dragonB = this.dragons[1];
            const ropeVerts = 10;
            this.rope = {
                verts: [], // {pos: Vector, vel: Vector}
                mass: 0.1,
                dragonMass: 1,
                stiffness: 0.8, // spring constant
                damping: 0.15,
            };
            for (let i = 0; i < ropeVerts; i++) {
                // Linearly interpolate between dragons
                const t = i / (ropeVerts - 1);
                const pos = dragonA.pos.clone().lerp(dragonB.pos, t);
                this.rope.verts.push({ pos, vel: new Vector(0, 0) });
            }
        }
        const rope = this.rope;
        const dt = 1 / 60; // Assume 60 FPS for physics
        // Attach ends to dragons
        rope.verts[0].pos = this.dragons[0].pos.clone();
        rope.verts[rope.verts.length - 1].pos = this.dragons[1].pos.clone();
        // Physics: simple spring between each vertex
        const maxSegLen = 50;
        for (let i = 1; i < rope.verts.length - 1; i++) {
            let v = rope.verts[i];
            let prev = rope.verts[i - 1];
            let next = rope.verts[i + 1];
            // Spring force from neighbors
            let force = new Vector(0, 0);
            let restLen = maxSegLen;
            // Prev spring
            let dPrev = v.pos.clone().sub(prev.pos);
            let lenPrev = dPrev.mag();
            let fPrev = dPrev.clone().normalize().mult(-rope.stiffness * (lenPrev - restLen));
            // Next spring
            let dNext = v.pos.clone().sub(next.pos);
            let lenNext = dNext.mag();
            let fNext = dNext.clone().normalize().mult(-rope.stiffness * (lenNext - restLen));
            force = force.add(fPrev).add(fNext);
            // Damping
            force = force.sub(v.vel.clone().mult(rope.damping));
            // Update velocity and position
            v.vel = v.vel.add(force.mult(dt / rope.mass));
            v.pos = v.pos.add(v.vel.mult(dt));
        }
        // Cap rope length: if any segment exceeds maxSegLen, pull it back
        for (let i = 1; i < rope.verts.length; i++) {
            let a = rope.verts[i - 1];
            let b = rope.verts[i];
            let d = b.pos.clone().sub(a.pos);
            let dist = d.mag();
            if (dist > maxSegLen) {
                let excess = dist - maxSegLen;
                let correction = d.clone().normalize().mult(excess / 2);
                // Move both vertices toward each other, except endpoints (dragons)
                if (i === 1) {
                    // a is dragon 0
                    this.dragons[0].pos = this.dragons[0].pos.add(correction);
                } else {
                    a.pos = a.pos.add(correction);
                }
                if (i === rope.verts.length - 1) {
                    // b is dragon 1
                    this.dragons[1].pos = this.dragons[1].pos.sub(correction);
                } else {
                    b.pos = b.pos.sub(correction);
                }
            }
        }
        // Optionally: apply dragon input as force to rope ends (not needed if dragons move themselves)
    }
    // Draw rope between dragons
    drawRope() {
        if (!this.rope || !this.dragons || this.dragons.length < 2) return;
        const verts = this.rope.verts;
        if (!verts || verts.length < 2) return;
        // Draw rope as lines between vertices
        for (let i = 0; i < verts.length - 1; i++) {
            this.Draw.line(verts[i].pos, verts[i + 1].pos, '#FFD700', 6); // gold rope, thickness 6
        }
    }
}