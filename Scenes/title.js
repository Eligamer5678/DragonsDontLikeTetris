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
            'coop-ui1':'Assets/Backgrounds/Base coop UI 1.png',
            'coop-ui2':'Assets/Backgrounds/Base coop UI 2.png',
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
            'blue-dragon':'Assets/Sprites/blue dragon.png',
            'fragment':'Assets/Sprites/fragment.png',
        }
        this.SpriteImages = {
            'fireball':new Image(),
            'dragon':new Image(),
            'blue-dragon':new Image(),
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
            'coop-ui1':new Image(),
            'coop-ui2':new Image(),
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
                case 'dragons': this.dragon = value[0]; break;
                case 'settings-button': this.elements.set('settings-button', value); break;
                case 'pause': this.elements.set('pause', value); break;
                default: console.warn(`Unknown resource key: ${key}`); log = false;
            }
            if (log) console.log(`Loaded: ${key}`);
        }
        this.twoPlayer = false;
        this.genBlocks()
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
        resources.set('dragons',this.dragons)
        resources.set('twoPlayer',this.twoPlayer)
        resources.set('settings-button',this.elements.get('settings-button'))
        return resources; 
    }

    onReady() {
        // --- 2 player mode setup ---
        this.twoPlayer = false;
        if (this.blocks && this.blocks.length > 0) {
            const idx = Math.floor(Math.random() * this.blocks.length);
            console.log('2P block index:', idx, this.blocks[idx]);
        }
        this.isReady = true;
        this.createUI()
        this.dragons = [new Dragon(this.mouse, this.keys, this.UIDraw, new Vector(690,75),this.SpriteImages)]
        this.dragons[0].vlos = new Vector(0.0001,0);
        // Hide loading overlay now
        try {
            this._loadingOverlay && this._loadingOverlay.hide();
        } catch (e) { /* ignore */ }

        this.createRectTool();
        // --- Generalize blocks: grid align and split big ones ---
        this.genBlocks()
        this.saver.set('twoPlayer',false)
        
    }
    genBlocks(){
        const grid = 120;
        const ratio = 0.3
        const rawBlocks = [
            {pos: {x:1688.377219840784, y:848.487486398259}, size: {x:-114.04776484996933, y:-112.81828073993472}},
            {pos: {x:1918.8242498469076, y:501.8063112078346}, size: {x:-460.89406001224734, y:231.51251360174103}},
            {pos: {x:1918.8242498469076, y:501.8063112078346}, size: {x:-112.87201469687693, y:-115.16866158868339}},
            {pos: {x:1456.7544396815676, y:847.3122959738846}, size: {x:463.2455603184326, y:231.51251360174092}},
            {pos: {x:1688.377219840784, y:734.4940152339499}, size: {x:231.6227801592163, y:113.99347116430908}},
            {pos: {x:1456.7544396815676, y:1075.2992383025028}, size: {x:-114.04776484996933, y:-110.46789989118622}},
            {pos: {x:460.89406001224745, y:847.3122959738846}, size: {x:-462.0698101653399, y:222.11099020674646}},
            {pos: {x:577.2933251684018, y:962.4809575625679}, size: {x:-115.22351500306189, y:104.5919477693144}},
            {pos: {x:229.27127985303125, y:615.7997823721436}, size: {x:-110.52051439069199, y:230.33732317736667}},
            {pos: {x:116.39926515615433, y:728.6180631120783}, size: {x:-115.22351500306186, y:119.86942328618068}}
        ];
        this.blocks = [];
        rawBlocks.forEach(b => {
            // Normalize negative sizes
            let pos = {...b.pos};
            let size = {...b.size};
            if(size.x < 0) { pos.x += size.x; size.x = Math.abs(size.x); }
            if(size.y < 0) { pos.y += size.y; size.y = Math.abs(size.y); }
            // Round position and size to grid
            let startX = Math.floor(pos.x / grid) * grid;
            let startY = Math.floor(pos.y / grid) * grid;
            let endX = Math.ceil((pos.x + size.x) / grid) * grid;
            let endY = Math.ceil((pos.y + size.y) / grid) * grid;
            // Split into grid-aligned blocks, but only if 80% of the block is within the original area
            for(let x = startX; x < endX; x += grid) {
                for(let y = startY; y < endY; y += grid) {
                    let blockW = Math.min(grid, endX - x);
                    let blockH = Math.min(grid, endY - y);
                    // Calculate overlap area
                    let overlapX = Math.max(0, Math.min(x+blockW, pos.x+size.x) - Math.max(x, pos.x));
                    let overlapY = Math.max(0, Math.min(y+blockH, pos.y+size.y) - Math.max(y, pos.y));
                    let overlapArea = overlapX * overlapY;
                    let blockArea = blockW * blockH;
                    if (blockArea > 0 && overlapArea / blockArea >= ratio) {
                        this.blocks.push({
                            pos: {x: x, y: y},
                            size: {x: blockW, y: blockH},
                            hp: 5,
                            destroyed: false,
                        });
                    }
                }
            }
        });
    }

    createUI(){
        let startButton = new UIButton(this.mouse,this.keys,new Vector(660,462),new Vector(600,200),1,'Enter','#FF000000','#FFFFFF33','#00000055')
        let modifierButton = new UIButton(this.mouse,this.keys,new Vector(660,720),new Vector(600,190),1,null,'#FF000000','#FFFFFF33','#00000055')
        startButton.onPressed.left.connect(async ()=>{
            this.removeScene('game')
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
        this.blocks.forEach((block, i) => {
            let color = new Color(0.6,1,0.3,1)
            color.d = block.hp/5   
            if (i===0) {
                color = new Color(0.55,1,0.3,Math.max(this.blocks.length/33,0.2));
                // Draw blue-dragon image beneath block, in background context
                this.Draw.image(
                    this.SpriteImages['blue-dragon'],
                    new Vector(block.pos.x+40, block.pos.y+40),
                    new Vector(40, 40),
                    false,
                    0.2
                );
            }
            if(this.mouse.pressed('left') && Geometry.pointInRect(this.mouse.pos,block.pos,new Vector(120,120))){
                console.log(i)
            }
            this.Draw.rect(new Vector(block.pos.x, block.pos.y), new Vector(block.size.x, block.size.y), color);
        });
        this.UIDraw.useCtx('overlays')
        this.UIDraw.clear()
        this.dragons.forEach((dragon)=>{
            dragon.draw()
        })
        this.UIDraw.useCtx('UI')

        this.drawRectTool();
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
        this.dragons.forEach((dragon)=>{
            dragon.update(delta);
            for (let elm of sortedElements) {
                elm.update(delta);

                let collision = Geometry.spriteToTile(dragon.pos.clone(), dragon.vlos.clone(), dragon.size, elm.pos, elm.size);
                if (collision) {
                    dragon.pos = collision.pos;
                    dragon.vlos = collision.vlos;
                }
            }
        })
        // block & fireball collision
        for (let i = 0; i < this.blocks.length; ++i) {
            let block = this.blocks[i];
            // Dragon standing on block
            this.dragons.forEach((dragon)=>{
                if (dragon) {
                    let collision = Geometry.spriteToTile(
                        dragon.pos.clone(),
                        dragon.vlos.clone(),
                        dragon.size,
                        new Vector(block.pos.x, block.pos.y),
                        new Vector(block.size.x, block.size.y)
                    );
                    if (collision) {
                        dragon.pos = collision.pos;
                        dragon.vlos = collision.vlos;
                        dragon.onBlock = block;
                    }
                }
                // Fireball collision
                if (dragon && dragon.fireballs && dragon.fireballs.length > 0) {
                    for (let fire of dragon.fireballs) {
                        let fireCollision = Geometry.spriteToTile(
                            fire.pos.clone(),
                            fire.vlos ? fire.vlos.clone() : new Vector(0,0),
                            new Vector(fire.size.x,0.1),
                            new Vector(block.pos.x, block.pos.y),
                            new Vector(block.size.x, block.size.y)
                        );
                        if (fireCollision) {
                            block.hp -= 2;
                            if (block.hp <= 0) {
                                block.destroyed = true;
                            }
                        }
                    }
                }
            })
        }
        // Remove destroyed blocks
        this.blocks = this.blocks.filter(b => !b.destroyed);
        if(this.blocks.length===0 && this.twoPlayer===false){
            this.twoPlayer = true;
            this.saver.set('twoPlayer',true)
            this.dragons = [
                new Dragon(this.mouse, this.keys, this.UIDraw, this.dragons[0].pos,this.SpriteImages,'wasd'),
                new Dragon(this.mouse, this.keys, this.UIDraw, new Vector(40+100,800),this.SpriteImages,'arrows'),
            ]
            this.dragons[0].which = 0;
            this.dragons[1].which = 1;
            this.dragons[0].twoPlayer = true;
            this.dragons[1].twoPlayer = true;
            this.dragons[1].image = this.SpriteImages['blue-dragon'];
        }
        // ui + fireball collision
        if(!this.saver.get('twoPlayer',false)){
            this.dragons.forEach((dragon)=>{
                if (dragon && dragon.fireballs && dragon.fireballs.length > 0) {
                    const fires = dragon.fireballs.slice();
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
            })
        }
        
        this.updateRectTool();
    }
    
    createRectTool(){
        this.rects = [];
        this.drawingRects = false;
        this.selectedRect = null;
        this.previewRect = null;
        this.mode = 'draw';
        this.editEdge = null; // {rect, edge}

        
    }
    updateRectTool(){
        // Start/stop drawing
        if(this.keys.pressed('2')){
            this.drawingRects = true;
            this.selectedRect = null;
            this.mode = 'draw';
            this.editEdge = null;
        }
        if(this.keys.pressed('1')){
            this.drawingRects = false;
            this.selectedRect = null;
            this.editEdge = null;
        }
        // Log
        if(this.keys.pressed('3')){
            this.rects.forEach((rect, i) => {
                console.log(
                    `Rect ${i}: pos.x=${rect.pos.x}, pos.y=${rect.pos.y}, size.x=${rect.size.x}, size.y=${rect.size.y}`
                );
            });
        }
        // Switch modes
        if(this.keys.pressed('5')&&this.mode==='select') this.mode = 'grab';
        if(this.keys.pressed('4')) this.mode = 'select';
        if(this.keys.pressed('6')&&this.mode==='select') this.mode = 'draw';
        if(this.keys.pressed('7')&&this.mode==='select') this.mode = 'edit';

        // Update
        if(!this.drawingRects) return;
        if(this.mode==='draw'){
            this.drawRect();
        }
        if(this.mode==='select'){
            this.selectRect();
        }
        if(this.mode==='grab'){
            this.grabRect();
        }
        if(this.mode==='edit'){
            this.editRectEdge();
        }
    }
    editRectEdge(){
        // Select edge if none selected
        if(!this.editEdge){
            for(let rect of this.rects){
                let mx = this.mouse.pos.x, my = this.mouse.pos.y;
                let rx = rect.pos.x, ry = rect.pos.y, rw = rect.size.x, rh = rect.size.y;
                const edgeDist = 8;
                if(Math.abs(mx - rx) < edgeDist && my > ry && my < ry+rh && this.mouse.pressed('left')){
                    this.editEdge = {rect, edge:'left', axis: null, grabStarted: false};
                    break;
                }
                if(Math.abs(mx - (rx+rw)) < edgeDist && my > ry && my < ry+rh && this.mouse.pressed('left')){
                    this.editEdge = {rect, edge:'right', axis: null, grabStarted: false};
                    break;
                }
                if(Math.abs(my - ry) < edgeDist && mx > rx && mx < rx+rw && this.mouse.pressed('left')){
                    this.editEdge = {rect, edge:'top', axis: null, grabStarted: false};
                    break;
                }
                if(Math.abs(my - (ry+rh)) < edgeDist && mx > rx && mx < rx+rw && this.mouse.pressed('left')){
                    this.editEdge = {rect, edge:'bottom', axis: null, grabStarted: false};
                    break;
                }
            }
            return;
        }

        let {rect, edge, axis, grabStarted} = this.editEdge;

        // Start grab on x/y key
        if(!grabStarted) {
            if(this.keys.pressed('g') && (edge === 'left' || edge === 'right')) {
                this.editEdge.axis = 'x';
                this.editEdge.grabStarted = true;
                this.mouse.grab(this.mouse.pos);
                this.editEdge.originalPos = rect.pos.x;
                this.editEdge.originalSize = rect.size.x;
            }
            if(this.keys.pressed('g') && (edge === 'top' || edge === 'bottom')) {
                this.editEdge.axis = 'y';
                this.editEdge.grabStarted = true;
                this.mouse.grab(this.mouse.pos);
                this.editEdge.originalPos = rect.pos.y;
                this.editEdge.originalSize = rect.size.y;
            }
            // Allow deselect with right mouse
            if(this.mouse.pressed('right')){
                this.editEdge = null;
                this.mouse.releaseGrab();
            }
            return;
        }

        // Move edge with grab delta
        let delta = this.mouse.getGrabDelta();
        if(this.editEdge.axis === 'x'){
            if(edge === 'left'){
                let newX = this.editEdge.originalPos + delta.x;
                let maxX = rect.pos.x + rect.size.x - 8;
                rect.pos.x = Math.min(newX, maxX);
                rect.size.x = Math.max(this.editEdge.originalSize - delta.x, 8);
            }
            if(edge === 'right'){
                rect.size.x = Math.max(this.editEdge.originalSize + delta.x, 8);
            }
        }
        if(this.editEdge.axis === 'y'){
            if(edge === 'top'){
                let newY = this.editEdge.originalPos + delta.y;
                let maxY = rect.pos.y + rect.size.y - 8;
                rect.pos.y = Math.min(newY, maxY);
                rect.size.y = Math.max(this.editEdge.originalSize - delta.y, 8);
            }
            if(edge === 'bottom'){
                rect.size.y = Math.max(this.editEdge.originalSize + delta.y, 8);
            }
        }

        // Release grab and deselect edge with right mouse, and reset shape
        if(this.mouse.pressed('right')){
            if(this.editEdge.grabStarted) {
                // Reset to original position/size
                if(this.editEdge.axis === 'x') {
                    rect.pos.x = this.editEdge.originalPos;
                    rect.size.x = this.editEdge.originalSize;
                }
                if(this.editEdge.axis === 'y') {
                    rect.pos.y = this.editEdge.originalPos;
                    rect.size.y = this.editEdge.originalSize;
                }
            }
            this.editEdge = null;
            this.mouse.releaseGrab();
            return;
        }
        // Release grab when left mouse released
        if( this.mouse.held('left')){
            this.editEdge = null;
            this.mouse.releaseGrab();
        }
    }
    drawRect(){
        // Drawing logic for the rectangle tool
        if(this.mouse.pressed('left')){
            this.mouse.grab(this.mouse.pos);
        }
        if(this.mouse.pressed('right')){
            this.mouse.releaseGrab();
            this.previewRect = null;
        }
        if(this.mouse.grabPos === null) return;
        let grabDelta = this.mouse.getGrabDelta();
        let startPos = this.mouse.grabPos;
        this.previewRect = {
            'pos': startPos.clone(),
            'size': new Vector(grabDelta.x, grabDelta.y)
        }
        if(this.keys.pressed(' ')){
            this.rects.push({
                'pos': startPos.clone(),
                'size': new Vector(grabDelta.x, grabDelta.y)
            })
            this.previewRect = null;
            this.mouse.releaseGrab();
        }
    }
    selectRect(){
        this.rects.forEach((rect) => {
            if(Geometry.rectCollide(this.mouse.pos, new Vector(1,1), rect.pos, rect.size)&&this.mouse.held('left')){
                this.selectedRect = rect;
            }
        });
    }
    grabRect(){
        if(!this.selectedRect) {this.mode = 'select'; return;}
        if(this.mouse.grabPos === null){this.mouse.grab(this.mouse.pos);}
        this.previewRect = { 'pos':this.selectedRect.pos.clone(), 'size':this.selectedRect.size.clone() };
        let grabDelta = this.mouse.getGrabDelta();
        this.previewRect.pos.addS(grabDelta);
        if(this.mouse.pressed('right')){
            this.mouse.releaseGrab();
            this.previewRect = null;
            this.mode = 'select';
        }
        if(this.keys.pressed(' ')||this.mouse.pressed('left')){
            this.mouse.releaseGrab();
            this.rects.splice(this.rects.indexOf(this.selectedRect),1);
            this.rects.push({ 'pos':this.previewRect.pos.clone(), 'size':this.previewRect.size.clone() });
            this.selectedRect = this.rects[this.rects.length-1];
            this.previewRect = null;
            this.mode = 'select';
        }
    }

    drawRectTool(){
        this.UIDraw.useCtx('overlays');
        // Draw existing rectangles
        for(let rect of this.rects){
            this.UIDraw.rect(rect.pos, rect.size, '#00FF00FF');
        }
        // Draw preview rectangle
        if(this.previewRect){
            this.UIDraw.rect(this.previewRect.pos, this.previewRect.size, '#FF0000FF');
            if(this.mode === 'grab') this.UIDraw.rect(this.previewRect.pos, this.previewRect.size, '#0000FF55');
        }
        if(this.selectedRect){
            this.UIDraw.rect(this.selectedRect.pos, this.selectedRect.size, '#0000FFFF');
        }
        // Draw edge highlight in edit mode
        if(this.mode==='edit' && this.editEdge){
            let {rect, edge} = this.editEdge;
            let rx = rect.pos.x, ry = rect.pos.y, rw = rect.size.x, rh = rect.size.y;
            let color = '#FFFF00FF';
            if(edge==='left') this.UIDraw.line(new Vector(rx+2,ry), new Vector(rx,ry+rh), color, 4);
            if(edge==='right') this.UIDraw.line(new Vector(rx+rw-2,ry), new Vector(rx+rw,ry+rh), color, 4);
            if(edge==='top') this.UIDraw.line(new Vector(rx,ry+2), new Vector(rx+rw,ry+2), color, 4);
            if(edge==='bottom') this.UIDraw.line(new Vector(rx,ry+rh-2), new Vector(rx+rw,ry+rh), color, 4);
        }
        this.UIDraw.useCtx('UI');
    }
}
