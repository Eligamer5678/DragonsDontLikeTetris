import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import SoundManager from '../js/SoundManager.js'
import MusicManager from '../js/MusicManager.js'
import Color from '../js/Color.js';
import UIButton from '../js/UI/Button.js';
import UISlider from '../js/UI/Slider.js';
import UIRect from '../js/UI/Rect.js';
import UIImage from '../js/UI/Image.js';
import Menu from '../js/UI/Menu.js';
import { Dragon } from '../Game logic/sprites.js';
import Geometry from '../js/Geometry.js';
import LoadingOverlay from '../js/UI/LoadingOverlay.js';

export class TitleScene extends Scene {
    constructor(Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene) {
        super('title', Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene);
        this.loaded = 0;
        this.defaultSaveData = {
            'settings':{
                'volume': {
                    'music':0.5,
                    'sfx':0.5,
                    'narrator':0.5,
                },
                'colors':{
                    'particles':'',
                    'blocks':new Color(0.59,1,0.36,1,'hsv'),
                    'danger':new Color(0,1,1,1,'hsv'),
                    'grid':new Color(0,0,1,0.3,'hsv'),
                    'timer':new Color(0,0,1,0.12,'hsv'),
                    'ghost':'',
                },
                'particles':0.1
            },
            'game':{
                'blocks':0,
                'frags':0,
                'blueScreens':0,
                'upgrades':[0,0,0,0,0,0],
                'rewards':[false,false,false,false,false,false],
                'time':0,
            }
        }
        this.settings = this.defaultSaveData.settings;
        this.elements = new Map()
        
    }
    
    async onPreload(resources=null) {
        this.soundGuy = new SoundManager()
        this.narrator = new SoundManager()
        this.musician = new SoundManager()
        this.conductor = new MusicManager(this.musician)
        // Ensure skipLoads flag exists (default false) and register a shortcut signal
        window.Debug.addFlag('skipLoads', false);
        window.Debug.createSignal('skip', ()=>{ window.Debug.addFlag('skipLoads', true); });

        // Create and show loading overlay
        try {
            this._loadingOverlay = document.querySelector('loading-overlay') || new LoadingOverlay();
            if (!document.body.contains(this._loadingOverlay)) document.body.appendChild(this._loadingOverlay);
            this._loadingOverlay.setTitle('Dragons Don\'t Like Tetris');
            this._loadingOverlay.setMessage('Starting...');
            this._loadingOverlay.setProgress(0);
            this._loadingOverlay.show();
        } catch (e) {
            console.warn('Could not create loading overlay:', e);
        }
    await this.loadImages()
    this._loadingOverlay && this._loadingOverlay.setProgress(0.25);
    this._loadingOverlay && this._loadingOverlay.setMessage('Loading sounds...');
    await this.loadSounds()
    this._loadingOverlay && this._loadingOverlay.setProgress(0.5);
        if(window.Debug.getFlag('skipLoads')===false){
            await this.loadNarrator()
            await this.loadMusic()
        }else{  
            this.loaded+=2;
        }
        if(this.loaded>=3){
            console.log('Finished loading')
        }
        try {
            // Only start the conductor if music was loaded or if the user hasn't skipped loads
            if (!window.Debug || !window.Debug.skipLoads) {
                this.conductor.start(0.5);
            } else {
                console.log('Skipping conductor.start because skipLoads is enabled');
            }
        } catch (e) {
            console.warn('Conductor start failed:', e);
        }
    }

    async loadImages(){
    // Loading images
        this.BackgroundImageLinks = {
            'ui1':'Assets/Backgrounds/Base UI 1.png',
            'ui2':'Assets/Backgrounds/Base UI 2.png',
            'settings':'Assets/Backgrounds/Base Settings.png',
            'background':'Assets/Backgrounds/Base Background.png',
            'title':'Assets/Backgrounds/Title screen.png',
            'bsod':'Assets/Backgrounds/BSOD.png',
            'desktop':'Assets/Backgrounds/windows.png',
            'modifiers':'Assets/Backgrounds/modifier_screen.png',
        }
        this.SpriteImageLinks = {
            'fireball':'Assets/Sprites/fireball.png',
            'mega-fireball':'Assets/Sprites/fireball2.png',
            'dragon':'Assets/Sprites/dragon.png',
            'fragment':'Assets/Sprites/fragment.png',
        }
        this.SpriteImages = {
            'fireball':new Image(),
            'dragon':new Image(),
            'mega-fireball':new Image(),
            'fragment':new Image(),
            
        }
        this.BackgroundImages = {
            'bsod':new Image(),
            'settings':new Image(),
            'background':new Image(),
            'title':new Image(),
            'ui1':new Image(),
            'ui2':new Image(),
            'modifiers':new Image(),
            'desktop':new Image(),

        }
        for(let file in this.BackgroundImages){
            this.BackgroundImages[file].src = this.BackgroundImageLinks[file];
            if (this._loadingOverlay) {
                // rough incremental progress while images load
                const idx = Object.keys(this.BackgroundImages).indexOf(file);
                const total = Object.keys(this.BackgroundImages).length + Object.keys(this.SpriteImages).length;
                const progress = Math.min(0.2, ((idx + 1) / total) * 0.2);
                this._loadingOverlay.setProgress(progress);
            }
        }
        for(let file in this.SpriteImages){
            this.SpriteImages[file].src = this.SpriteImageLinks[file];
            if (this._loadingOverlay) {
                const idx = Object.keys(this.SpriteImages).indexOf(file) + Object.keys(this.BackgroundImages).length;
                const total = Object.keys(this.BackgroundImages).length + Object.keys(this.SpriteImages).length;
                const progress = Math.min(0.25, ((idx + 1) / total) * 0.25);
                this._loadingOverlay.setProgress(progress);
            }
        }
    // Images loaded
        this.loaded += 1;
        this._loadingOverlay && this._loadingOverlay.setProgress(0.25);
    }

    async loadMusic(){
    // Loading music
        const musicFiles = [
            ['intro', "Assets/sounds/Dragons don't like tetris p1.wav"],
            ['part1', "Assets/sounds/Dragons don't like tetris p2.wav"],
            ['part2', "Assets/sounds/Dragons don't like tetris p3.wav"],
            ['part3', "Assets/sounds/Dragons don't like tetris p4.wav"],
            ['part4', "Assets/sounds/Dragons don't like tetris p5.wav"],
            ['segue', "Assets/sounds/Dragons don't like tetris p6.wav"],
            ['part5', "Assets/sounds/Dragons don't like tetris p7.wav"]
        ];

        let musicSkipped = false;
        for (const [key, path] of musicFiles) {
            // If the debug flag was toggled to skip during loading, stop further loads
            if (window.Debug && typeof window.Debug.getFlag === 'function' && window.Debug.getFlag('skipLoads')) {
                console.log('Skipping remaining music loads (user requested skip)');
                musicSkipped = true;
                break;
            }
            await this.musician.loadSound(key, path);
            if (this._loadingOverlay) {
                // progress between 50% and 90% during music load
                const idx = musicFiles.findIndex(m => m[0] === key);
                const progress = 0.5 + (idx + 1) / musicFiles.length * 0.4;
                this._loadingOverlay.setProgress(progress);
                this._loadingOverlay.setMessage(`Loading music: ${key}`);
            }
        }

        if (musicSkipped) {
            // Consider this load-step done and avoid running remaining setup
            this.loaded += 1;
            this._loadingOverlay && this._loadingOverlay.setMessage('Music skipped');
            return;
        }

        this.conductor.setSections([
            { name: "intro", loop: false },
            { name: "part1", loop: true },
            { name: "part2", loop: true },
            { name: "part3", loop: true },
            { name: "part4", loop: true },
            { name: "segue", loop: false },
            { name: "part5", loop: false }
        ]);

        // conditions correspond to section indexes 1..4
        const conditions = [
            () => 1+1==11,
        ];
        conditions.forEach((cond, i) => this.conductor.setCondition(i + 1, cond));

    // Start playback
        this.loaded += 1;
        this._loadingOverlay && this._loadingOverlay.setProgress(0.9);
    }

    async loadSounds(){
    // Loading sound effects
        const sfx = [
            ['fireball', 'Assets/sounds/fireball_hit.wav'],
            ['crash', 'Assets/sounds/crash.wav'],
            ['break', 'Assets/sounds/break.wav'],
            ['place', 'Assets/sounds/place.wav'],
            ['rotate', 'Assets/sounds/rotate.wav'],
            ['lineclear', 'Assets/sounds/lineclear.wav']
        ];

        for (const [key, path] of sfx) {
            await this.soundGuy.loadSound(key, path);
            if (this._loadingOverlay) {
                const idx = sfx.findIndex(s => s[0] === key);
                const progress = 0.25 + (idx + 1) / sfx.length * 0.25;
                this._loadingOverlay.setProgress(progress);
                this._loadingOverlay.setMessage(`Loading SFX: ${key}`);
            }
        }
    // Sound effects loaded
        this.loaded += 1;
        this._loadingOverlay && this._loadingOverlay.setProgress(0.5);
    }

    async loadNarrator(){
    // Loading narrator 
        if (window.Debug && typeof window.Debug.getFlag === 'function' && window.Debug.getFlag('skipLoads')) {
            console.log('Skipping narrator loads due to skipLoads flag');
            this.loaded += 1;
            return;
        }
        const narratorFiles = [
            ["WhatIsThis2", 'Assets/narrator/WhatIsThis2.wav'],
            ["WhatIsThis1", 'Assets/narrator/WhatIsThis1.wav'],
            ["This isnt dungions & dragons 1", "Assets/narrator/This isn't dungions & dragons 1.wav"],
            ["This isnt dungions & dragons 2", "Assets/narrator/This isn't dungions & dragons 2.wav"],
            ["Stop destroying the blocks 1", 'Assets/narrator/Stop destroying the blocks 1.wav'],
            ["Stop destroying the blocks 2", 'Assets/narrator/Stop destroying the blocks 2.wav'],
            ["Stop destroying the blocks 3", 'Assets/narrator/Stop destroying the blocks 3.wav'],
            ["bigger fireballs 2", 'Assets/narrator/bigger fireballs 2.wav'],
            ["bigger fireballs", 'Assets/narrator/bigger fireballs.wav'],
            ["Are you getting stronger", 'Assets/narrator/Are you getting stronger.wav'],
            ["disappear 7", 'Assets/narrator/disappear 7.wav'],
            ["disappear 2", 'Assets/narrator/disappear 2.wav'],
            ["disappear 3", 'Assets/narrator/disappear 3.wav'],
            ["disappear 4", 'Assets/narrator/disappear 4.wav'],
            ["disappear 5", 'Assets/narrator/disappear 5.wav'],
            ["disappear 6", 'Assets/narrator/disappear 6.wav'],
            ["disappear 8", 'Assets/narrator/disappear 8.wav'],
            ["disappear 9", 'Assets/narrator/disappear 9.wav'],
            ["disappear", 'Assets/narrator/disappear.wav'],
            ["dont crash my pc 2", 'Assets/narrator/dont crash my pc 2.wav'],
            ["dont crash my pc", 'Assets/narrator/dont crash my pc.wav'],
            ["dragon left", 'Assets/narrator/dragon left.wav'],
            ["eyes wide open", 'Assets/narrator/eyes wide open.wav'],
            ["Go away 2", 'Assets/narrator/Go away 2.wav'],
            ["Go away 3", 'Assets/narrator/Go away 3.wav'],
            ["Go away", 'Assets/narrator/Go away.wav'],
            ["mule", 'Assets/narrator/mule.wav'],
            ["new ability 2", 'Assets/narrator/new ability 2.wav'],
            ["new ability 3", 'Assets/narrator/new ability 3.wav'],
            ["new ability", 'Assets/narrator/new ability.wav'],
            ["no! 2", 'Assets/narrator/no! 2.wav'],
            ["no! 3", 'Assets/narrator/no! 3.wav'],
            ["no!", 'Assets/narrator/no!.wav'],
            ["break everything", 'Assets/narrator/Seriously, are you going to break everything.wav'],
            ["speedrun 1", 'Assets/narrator/speedrun 1.wav'],
            ["speedrun 2", 'Assets/narrator/speedrun 2.wav'],
            ["success", 'Assets/narrator/success.wav'],
            ["tetris 2", 'Assets/narrator/tetris 2.wav'],
            ["tetris", 'Assets/narrator/tetris.wav'],
            ["thats great 2", 'Assets/narrator/thats great 2.wav'],
            ["thats great 3", 'Assets/narrator/thats great 3.wav'],
            ["thats great", 'Assets/narrator/thats great.wav'],
            ["why 2", 'Assets/narrator/why 2.wav'],
            ["why", 'Assets/narrator/why.wav']
        ];

        let narratorSkipped = false;
        for (const [key, path] of narratorFiles) {
            if (window.Debug && typeof window.Debug.getFlag === 'function' && window.Debug.getFlag('skipLoads')) {
                console.log('Skipping remaining narrator loads (user requested skip)');
                narratorSkipped = true;
                break;
            }
            await this.narrator.loadSound(key, path);
        }
        if (narratorSkipped) {
            this.loaded += 1;
            this._loadingOverlay && this._loadingOverlay.setMessage('Narrator skipped');
            return;
        }
        this.loaded += 1;
        this._loadingOverlay && this._loadingOverlay.setProgress(1);
    // Narrator loaded
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
                case 'musician': break;
                case 'conductor': this.conductor = value; break;
                case 'narrator': this.narrator = value; break;
                case 'dragon': this.dragon = value; break;
                case 'settings-button': this.elements.set('settings-button', value); break;
                case 'pause': this.elements.set('pause', value); break;
                default: console.warn(`Unknown resource key: ${key}`); log = false;
            }
            if (log) console.log(`Loaded: ${key}`);
        }
        this.conductor.reset();
    }

    onSwitchTo(){
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
        resources.set('pause',this.pauseMenu)
        resources.set('dragon',this.dragon)
        resources.set('settings-button',this.elements.get('settings-button'))
        return resources; 
    }

    onReady() {
        this.isReady = true;
        this.createUI()
        this.dragon = new Dragon(this.mouse, this.keys, this.UIDraw, new Vector(690,75),this.SpriteImages)
        this.dragon.vlos = new Vector(0.0001,0);
        // Hide loading overlay now
        try {
            this._loadingOverlay && this._loadingOverlay.hide();
        } catch (e) { /* ignore */ }
    }

    createUI(){
        let startButton = new UIButton(this.mouse,this.keys,new Vector(660,462),new Vector(600,200),1,'Enter','#FF000000','#FFFFFF33','#00000055')
        let modifierButton = new UIButton(this.mouse,this.keys,new Vector(660,720),new Vector(600,190),1,null,'#FF000000','#FFFFFF33','#00000055')
        startButton.onPressed.left.connect(async ()=>{
            this.switchScene('game')
            this.conductor.reset()
            this.conductor.setVolume(this.settings.volume.music,3)
            await this.narrator.playSequence(['WhatIsThis1','This isnt dungions & dragons 2'],this.settings.volume.narrator); 
        })
        
        modifierButton.onPressed.left.connect(()=>{
            this.switchScene('modifier')
        })
        this.elements.set('startButton',startButton)
        this.elements.set('modifierButton',modifierButton)
        let rect = new UIRect(new Vector(680,115),new Vector(60,20),0,'#FF000000')
        this.elements.set('debug-rect',rect)
        this.createPauseMenu()
    }

    createPauseMenu(){
        this.pauseMenu = new Menu(this.mouse, this.keys, new Vector(0,0),new Vector(0,0),2,'#400000ff');
        this.pauseMenu.addElement('Base',new UIImage(this.BackgroundImages['settings'],new Vector(0,0),new Vector(1920,1080),2));
        this.pauseMenu.visible = false;


        let closeButton = new UIButton(this.mouse, this.keys, new Vector(1725,50),new Vector(145,135),3,'Escape','#00000000','#FFFFFF33','#00000055');
        closeButton.onPressed.left.connect(()=>{this.pauseMenu.visible = false;})
        let openButton = new UIButton(this.mouse, this.keys, new Vector(1725,50),new Vector(145,135),1,'Escape','#00000000','#FFFFFF33','#00000055');
        openButton.onPressed.left.connect(()=>{this.pauseMenu.visible = true;});
        this.pauseMenu.addElement('closeButton',closeButton);

        
        let exitButton = new UIButton(this.mouse, this.keys, new Vector(1250,935),new Vector(304,95),3,'Backspace','#00000000','#FFFFFF33','#00000055')
        exitButton.onPressed.left.connect(()=>{
            this.pauseMenu.visible = false; 
            this.switchScene('title'); 
        })
        
        let musicSlider = new UISlider(this.mouse, this.keys, new Vector(1310,275),new Vector(540,40),3,'scalar',this.settings.volume.music,0,3,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        musicSlider.onChange.connect((a)=>{
            this.settings.volume.music = Math.max(a**2,0); 
            this.conductor.setVolume(Math.max(a**2,0));
        })
        this.pauseMenu.addElement('musicSlider',musicSlider)

        let sfxSlider = new UISlider(this.mouse, this.keys, new Vector(1310,330),new Vector(540,40),3,'scalar',this.settings.volume.sfx,0,3,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        sfxSlider.onChange.connect((a)=>{
            this.settings.volume.sfx = Math.max(a**2,0); 
            this.soundGuy.setVolume('place',Math.max(a**2,0));
            this.soundGuy.setVolume('rotate',Math.max(a**2,0));
            this.soundGuy.setVolume('lineclear',Math.max(a**2,0));
            this.soundGuy.setVolume('fireball',Math.max(a**2,0));
            this.soundGuy.setVolume('break',Math.max(a**2,0));
        })
        this.pauseMenu.addElement('sfxSlider',sfxSlider)

        let narratorSlider = new UISlider(this.mouse, this.keys, new Vector(1310,390),new Vector(540,40),3,'scalar',this.settings.volume.narrator,0,3,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        narratorSlider.onChange.connect((a)=>{
            this.settings.volume.narrator = Math.max(a**2,0); 
            this.soundGuy.setVolume('narrator',Math.max(a**2,0));
        })
        this.pauseMenu.addElement('narratorSlider',narratorSlider)

        let particleSlider = new UISlider(this.mouse, this.keys, new Vector(1314,533),new Vector(540,45),3,'scalar',this.settings.particles,0,1,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        particleSlider.onChange.connect((e)=>{
            this.settings.particles = e
        })
        this.pauseMenu.addElement('particleSlider',particleSlider)

        let dangerColorSlider = new UISlider(this.mouse, this.keys, new Vector(1310,600),new Vector(540,42),3,'color',new Color(0,1,1,1,'hsv'),0,0,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        dangerColorSlider.colorMode = 'a'
        dangerColorSlider.onChange.connect((e)=>{
            this.settings.colors.danger = e
        })
        this.pauseMenu.addElement('dangerColorSlider',dangerColorSlider)

        let blockColorSlider = new UISlider(this.mouse, this.keys, new Vector(1310,665),new Vector(540,44),3,'color',new Color(0.59,1,0.36,1,'hsv'),0,0,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        blockColorSlider.colorMode = 'a'
        blockColorSlider.onChange.connect((e)=>{
            this.settings.colors.blocks = e
        })
        this.pauseMenu.addElement('blockColorSlider',blockColorSlider)
        
        let gridColorSlider = new UISlider(this.mouse, this.keys, new Vector(1310,730),new Vector(540,44),3,'color',this.settings.colors.grid,0,0,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        gridColorSlider.colorMode = 'd'
        gridColorSlider.onChange.connect((e)=>{
            this.settings.colors.grid = e
        })
        this.pauseMenu.addElement('gridColorSlider',gridColorSlider)

        let timerColorSlider = new UISlider(this.mouse, this.keys, new Vector(1310,795),new Vector(540,44),3,'color',this.settings.colors.timer,0,0,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        timerColorSlider.colorMode = 'd'
        timerColorSlider.onChange.connect((e)=>{
            this.settings.colors.timer = e
        })
        this.pauseMenu.addElement('timerColorSlider',timerColorSlider)

        this.pauseMenu.addElement('exitButton',exitButton)

        this.elements.set('pauseMenu',this.pauseMenu);
        this.elements.set('settings-button',openButton);
    }

    draw() {
        if(!this.isReady) return;
        this.UIDraw.clear()
        this.Draw.image(this.BackgroundImages['title'],Vector.zero(),new Vector(1920,1080))

        let sortedElements = [...this.elements.values()].sort((a, b) => a.layer - b.layer);
        for (const elm of sortedElements) {
            elm.draw(this.UIDraw);
        }
        this.UIDraw.useCtx('overlays')
        this.UIDraw.clear()
        this.dragon.draw()
        this.UIDraw.useCtx('UI')
    }

    update(delta) {
        if(!this.isReady) return;
        if(this.keys.pressed('any') || this.mouse.pressed('any')){
            this.musician.resume()
        }
        if(this.loaded===4){
            
            this.loaded+=1
        }
        this.mouse.setMask(0);
        this.mouse.setPower(0);
        let sortedElements = [...this.elements.values()].sort((a, b) => b.layer - a.layer);
        this.dragon.update(delta);
        for (let elm of sortedElements) {
            elm.update(delta);
            let collision = Geometry.spriteToTile(this.dragon.pos.clone(), this.dragon.vlos.clone(), this.dragon.size, elm.pos, elm.size);
            if (collision) {
                this.dragon.pos = collision.pos;
                this.dragon.vlos = collision.vlos;
            }
        }

        // --- Fireball -> UIButton interaction (same logic as modifier scene) ---
        if (this.dragon && this.dragon.fireballs && this.dragon.fireballs.length > 0) {
            const fires = this.dragon.fireballs.slice();
            // Build a list of UIButton targets. Exclude the pause container itself (key === 'pause'),
            // but include any child buttons the pause container may hold, and only if visible.
            const buttons = [];
            for (const [key, el] of this.elements.entries()) {
                if (el && typeof el.onPressed === 'object' && el.visible !== false) buttons.push(el);
            }

            for (let fire of fires) {
                for (let btn of buttons) {
                    if (Geometry.rectCollide(fire.pos.sub(fire.size.mult(0.5)), fire.size, btn.pos.add(btn.offset || {x:0,y:0}), btn.size)) {
                        try {
                            btn.onPressed.left.emit();
                        } catch (e) {
                            if (btn.trigger) {
                                btn.triggered = !btn.triggered;
                                btn.onTrigger.emit(btn.triggered);
                            }
                        }
                        // Destroy the fireball so it can't trigger multiple buttons
                        try { fire.adiós(); } catch (e) { if (fire.destroy) fire.destroy.emit(fire); }

                        // Provide a quick visual feedback: pulse the baseColor
                        if (btn.baseColor) {
                            const orig = btn.baseColor;
                            btn.baseColor = '#FFFFFF44';
                            setTimeout(() => { btn.baseColor = orig; }, 120);
                        }
                        break;
                    }
                }
            }
        }
        
    }
}
