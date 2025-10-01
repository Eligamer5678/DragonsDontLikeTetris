import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import SoundManager from '../js/SoundManager.js'
import MusicManager from '../js/MusicManager.js'
import Color from '../js/Color.js';
import UIButton from '../js/UI/Button.js';
import UISlider from '../js/UI/Slider.js';
import UIImage from '../js/UI/Image.js';
import Menu from '../js/UI/Menu.js';

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
        await this.loadImages()
        await this.loadNarrator()
        await this.loadSounds()
        await this.loadMusic()
        if(this.loaded>=3){
            console.log('Finished loading')
        }
        this.conductor.start(0.5);
    }

    async loadImages(){
        console.log(`Loading images...`)
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
            console.log(`Loaded image: ${file}`)
        }
        for(let file in this.SpriteImages){
            this.SpriteImages[file].src = this.SpriteImageLinks[file];
            console.log(`Loaded image: ${file}`)
        }
        console.log(`Finished loading images`)
        this.loaded += 1;
    }

    async loadMusic(){
        console.log(`Loading music...`)
        const musicFiles = [
            ['intro', "Assets/sounds/Dragons don't like tetris p1.wav"],
            ['part1', "Assets/sounds/Dragons don't like tetris p2.wav"],
            ['part2', "Assets/sounds/Dragons don't like tetris p3.wav"],
            ['part3', "Assets/sounds/Dragons don't like tetris p4.wav"],
            ['part4', "Assets/sounds/Dragons don't like tetris p5.wav"],
            ['segue', "Assets/sounds/Dragons don't like tetris p6.wav"],
            ['part5', "Assets/sounds/Dragons don't like tetris p7.wav"]
        ];

        for (const [key, path] of musicFiles) {
            await this.musician.loadSound(key, path);
            console.log(`Loaded music section: ${key}`)
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
        console.log(`Finished loading music.`)
        this.loaded += 1;
    }

    async loadSounds(){
        console.log(`Loading sound effects...`)
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
            console.log(`Loaded sound: ${key}`)
        }
        console.log(`Finished loading sound effects.`)
        this.loaded += 1;
    }

    async loadNarrator(){
        console.log(`Firing narrator...`)
        const narratorFiles = [
            ["WhatIsThis2", 'Assets/narrator/WhatIsThis2.wav'],
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

        for (const [key, path] of narratorFiles) {
            await this.narrator.loadSound(key, path);
            console.log(`Loaded Dialouge: ${key}`)
        }
        this.loaded += 1;
        console.log(`Finished loading narrator`)
    }

    onSwitchFrom(resources){
        if (resources && resources.volume) {
            this.settings = resources;
        } else {
            this.settings = structuredClone(this.defaultSaveData.settings);
        }
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
        resources.set('settings-button',this.elements.get('settings-button'))
        return resources; 
    }

    onReady() {
        this.isReady = true;
        this.createUI()
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
            this.scene = 'modifiers'; 
        })
        this.elements.set('startButton',startButton)
        this.elements.set('modifierButton',modifierButton)
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
        for (let elm of sortedElements){
            elm.update(delta);
        }
    }
}
