import { Vector } from './js/Vector.js';
import { Color } from './js/color.js';
import { Mouse } from './js/Mouse.js';
import { Geometry } from './js/Geometry.js';
import { Keys } from './js/Keys.js';
import { Draw } from './js/Draw.js';
import { Signal } from './js/Signal.js';
import { SoundManager } from './js/SoundManager.js';
import { MusicManager } from './js/MusicManager.js';
import { Saver } from './js/Saver.js';
import { Menu } from './js/UI/Menu.js';
import { Debug } from './js/Debug.js';
import { UIButton } from './js/UI/Button.js';
import { UISlider } from './js/UI/Slider.js';
import { UIImage } from './js/UI/Image.js';
import { UIRect } from './js/UI/Rect.js';
import { addEvent, getID } from './js/Support.js';


/* checks if input data is a number or a vector */

const mainWidth = 1920;
const mainheight = 1080;

const debug = new Debug();

class Appicon {
    constructor(draw,pos,size,image){
        this.size = size;
        this.pos = pos.clone().sub(this.size.clone().multS(0.5));
        this.vlos = new Vector(Math.random()-0.5,Math.random()-0.5).normalize()
        this.speed = 300
        this.image = image
        this.health = 500
        this.rotation = Math.random()*2*Math.PI;
        this.rotVlos = Math.PI * (Math.random() > 0.5 ? -1:1)
        this.Draw = draw;
        this.destroy = new Signal()
    }
    update(delta){
        
    }
    adiós(){
        this.destroy.emit();
    }
    draw(){
        this.Draw.image(this.image,this.pos,this.size,1,0)
    }
}

class Dragon {
    constructor(program,draw,pos,images){
        this.pos = pos;
        this.keys = program.keys;
        this.mouse = program.mouse;
        this.Draw = draw;
        this.size = new Vector(50,50);
        this.images = images
        this.image = images['dragon']
        this.speed = 200;
        this.twoPlayer = false;
        this.anger = 0;
        this.health = 100
        this.power = 0.2
        this.big = false;
        this.heavy = false;
        this.fireballTimer = 5
        this.spin = 0;
        this.updraft = 0;
        this.vlos = new Vector(0,0);
        this.rot = 0;
        this.fireballs = []
        this.fireTime = 0;
        this.megaabilty = new Signal()
    }
    update(delta){
        this.size = new Vector(40*Math.max(Math.min(this.power,5),1),40*Math.max(Math.min(this.power,5),1))
        if(this.big){
            this.size = new Vector(40*Math.max(Math.min(this.power,5),1),40*Math.max(Math.min(this.power,5),1)).mult(2)
        }
        if(!this.keys.held('Shift')){
            this.vlos.y+=10*delta*Math.max(Math.min(this.power,5),1)
        }
        this.pos.addS(this.vlos);
        if (this.pos.y+this.size.y>1080){
            this.pos.y = 1080-this.size.y;
            this.vlos.y *=-0.3
        }
        if (this.pos.y<0){
            this.pos.y = 0;
            this.vlos.y *=-0.3
        }
        if (this.pos.x+this.size.y>1920){
            this.pos.x = 1920-this.size.x;
            this.vlos.x *=-0.3
        }
        if (this.pos.x<0){
            this.pos.x = 0;
            this.vlos.x *=-0.3
        }
        if(this.keys.held('ArrowRight')||(this.keys.held('d')||this.keys.held('D'))&&!this.twoPlayer){
            this.vlos.x+=2*Math.max(Math.min(this.power,5),1)
        }
        if(this.keys.held('ArrowLeft')||(this.keys.held('a')||this.keys.held('A'))&&!this.twoPlayer){
            this.vlos.x-=2*Math.max(Math.min(this.power,5),1)
        }
        if(this.keys.pressed('ArrowUp')||(this.keys.pressed('w')||this.keys.pressed('W'))&&!this.twoPlayer){
            this.vlos.y = -6 *Math.max(Math.min(this.power,5),1) - Math.abs(Math.min(Math.max(this.vlos.y,10),20))/10 *Math.max(Math.min(this.power,5),1)
        }else if(this.keys.held('ArrowUp',true)>0.2||(this.keys.held('w',true)>0.2||this.keys.held('W',true)>0.2)&&!this.twoPlayer){
            this.vlos.y = -6*Math.max(Math.min(this.power,5),1)
        }
        if(this.keys.held('ArrowDown')||(this.keys.held('s')||this.keys.held('S'))&&!this.twoPlayer){
            this.vlos.y = Math.abs(this.vlos.y)+20*delta * 1.2
        }
        if(this.keys.held(" ",true)){
            this.fireTime+=1;
        }else{
            this.fireTime = 0;
        }
        if(this.fireTime%this.fireballTimer===1 && this.keys.held(" ")){
            let fire = new FireBall(this,this.images['fireball'],this.Draw,this.pos.add(this.size.mult(0.5)),Math.PI * Math.round(((Math.sign(-this.vlos.x)+1))/2),500,this.power)
            fire.destroy.connect(() => {
                this.fireballs = this.fireballs.filter(item => item !== fire);
            })
            this.fireballs.push(fire)

            if(this.power>=1){
                let fire2 = new FireBall(this,this.images['fireball'],this.Draw,this.pos.add(this.size.mult(0.5)),Math.PI * Math.round(((Math.sign(-this.vlos.x)+1))/2)-0.2,500,this.power)
                fire2.destroy.connect(() => {
                    this.fireballs = this.fireballs.filter(item => item !== fire2);
                })
                this.fireballs.push(fire2)

                let fire3 = new FireBall(this,this.images['fireball'],this.Draw,this.pos.add(this.size.mult(0.5)),Math.PI * Math.round(((Math.sign(-this.vlos.x)+1))/2)+0.2,500,this.power)
                fire3.destroy.connect(() => {
                    this.fireballs = this.fireballs.filter(item => item !== fire3);
                })
                this.fireballs.push(fire3)

            }
            
        }
        if(this.anger === 1 && this.keys.pressed('g')){
            this.megaabilty.emit()
            this.anger = 0;
            this.spin = 2*Math.PI
            this.health+=10
        }
        if(this.spin>0){
            this.spin-=Math.PI/6;
            if(this.spin<0){
                this.spin = 0;
            }
            let fire = new FireBall(this,this.images['mega-fireball'],this.Draw,this.pos.add(this.size.mult(0.5)),this.spin,500,this.power*10,true)
            fire.destroy.connect(() => {
                this.fireballs = this.fireballs.filter(item => item !== fire);
            })
            this.fireballs.push(fire)
        }
        if(this.power>2){
            this.health+=1
        }
        if(this.health>100){
            this.health = 100;
        }
        this.vlos.x *= 0.8
        for(let i = this.fireballs.length-1; i>0; i--){
            this.fireballs[i].update(delta);
        }
        if(this.heavy){
            this.vlos.x *= 0.8;
            this.vlos.y += 3;
        }
        
    }
    draw(){
        let rot = Math.sign(this.vlos.x) * Math.PI/4 * Math.pow(this.vlos.y,0.3)/2
        this.Draw.image(this.image,this.pos,this.size,new Vector(Math.sign(this.vlos.x*-1)),rot)
        for(let i = this.fireballs.length-1; i>0; i--){
            this.fireballs[i].draw();
        }
    }
}

class FireBall {
    constructor(dragon,image,draw,pos,rot,speed,power,mega=false){
        this.pos = pos;
        this.dragon = dragon;
        this.vlos = new Vector(1,0).rotate(rot) 
        this.speed = speed;
        this.power = power;
        this.destroy = new Signal()
        this.Draw = draw
        this.rot = rot
        this.size = new Vector(1,1).mult(Math.max(power,1)*50)
        this.image = image
    }
    adiós(reason = ''){
        this.destroy.emit(this)
    }
    update(delta){
        this.pos.addS(this.vlos.mult(this.speed * delta))
        this.size = new Vector(1,1).mult(Math.min(this.power,5)*50)
        if(!Geometry.rectCollide(Vector.zero(),new Vector(1920,1080),this.pos,this.size)){
            this.adiós()
        }
    }
    draw(){
        this.Draw.image(this.image,this.pos.sub(this.size.mult(0.5)),this.size,0,this.rot)
    }
}

class Fragment {
    constructor(draw,pos,size){
        this.pos = pos;
        this.vlos = new Vector((Math.random()-0.5)*10,(Math.random()-0.5)*10)
        this.speed = 100;
        this.rotSpeed = (Math.random()-0.5)*20
        this.destroy = new Signal()
        this.Draw = draw
        this.rot = 0
        this.size = new Vector(1,1).mult(Math.min(2,1)*50).mult(size)
        this.image = new Image()
        this.image.src = 'Assets/fragment.png'
    }
    adiós(){
        this.destroy.emit(this)
    }
    update(delta){
        this.pos.addS(this.vlos.mult(this.speed * delta))
        if(!Geometry.rectCollide(Vector.zero(),new Vector(1920,1080),this.pos,this.size)){
            this.adiós()
        }
        this.rot+=this.rotSpeed
        this.vlos.y+=5*delta
    }
    draw(){
        this.Draw.image(this.image,this.pos.sub(this.size.min(100).mult(0.5)),this.size.min(100),0,this.rot)
    }
}

const Tetrominos = {
    'I':{
        'offset': new Vector(0.5,0.5),  // center the rotation like standard Tetris
        'tiles': [new Vector(-1.5,0.5), new Vector(-0.5,0.5), new Vector(0.5,0.5), new Vector(1.5,0.5)]
    },
    'O':{
        'offset': new Vector(0.5,0.5),
        'tiles': [new Vector(-0.5,-0.5),new Vector(0.5,0.5),new Vector(-0.5,0.5),new Vector(0.5,-0.5)]
    },
    'Z':{
        'offset': new Vector(0,0),
        'tiles': [new Vector(0,0),new Vector(0,1),new Vector(-1,1),new Vector(1,0)]
    },
    'S':{
        'offset': new Vector(0,0),
        'tiles': [new Vector(0,0),new Vector(0,1),new Vector(1,1),new Vector(-1,0)]
    },
    'T':{
        'offset': new Vector(0,0),
        'tiles': [new Vector(0,0),new Vector(-1,0),new Vector(1,0),new Vector(0,1)]
    },
    'L':{
        'offset': new Vector(0,0),
        'tiles': [new Vector(0,0),new Vector(-1,0),new Vector(1,0),new Vector(1,1)]
    },
    'J':{
        'offset': new Vector(0,0),
        'tiles': [new Vector(0,0),new Vector(-1,0),new Vector(1,0),new Vector(-1,1)]
    },
}

class Tetromino {
    constructor(type,data){
        this.data = null
        if (type === 'random'){
            type = ['I','O','T','J','L','S','Z'][Math.floor(Math.random()*7)]
        }
        if (type === 'custom'){
            this.data = data
        }else{
            this.data = structuredClone(Tetrominos[type])
        }
        this.pos = new Vector(4,1)
        this.rotation = 0
        this.type = type

    }
    getPositions(dir=0){
        return structuredClone(this.data['tiles']).map((e)=>{return new Vector(e.x,e.y).rotate(dir*Math.PI/2+this.rotation).add(this.data['offset']).add(this.pos)})
    }
    rotate(dir=1){
        this.rotation += dir * Math.PI/2;
    }
}

class Game {
    constructor(program) {
        this.program = program; 

        this.soundGuy = new SoundManager()
        this.narrator = new SoundManager()
        this.musician = new SoundManager()
        this.conductor = new MusicManager(this.musician)

        // Helpers
        this.mouse = program.mouse;
        this.keys = program.keys;
        this.Draw = program.Draw;  
        this.UIDraw = program.UIDraw; 
        
        this.resets = 0
        this.deaths = 0;

        // other inportant things
        this.runtime = 0;
        this.delta = 0;
        this.program.addLayer('base',false);
        this.program.addLayer('UI',true);
        this.program.updateZ();
        this.gridScale = new Vector(0.9,0.9);
        this.gridSize = new Vector(1080/2*this.gridScale.x,1080*this.gridScale.y);
        this.sessionBlocks = 0;
        this.gridPos = new Vector(1920/2-this.gridSize.x/2,1080/2-this.gridSize.y/2);
        this.setUpBoard();
        this.justSpawned = false;
        this.activeTetromino = new Tetromino('J');
        this.particles = [];

        // Save data
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
        this.saver = new Saver("DragonsDontlikeTetris");
        this.settings = this.defaultSaveData.settings;
        this.gameData = this.saver.getOrAdd('game',this.defaultSaveData.game);
        

        this.loadedIcons = false;
        this.lines = 0;
        
        this.desktopIcons = [
            new Image(),
            new Image(),
            new Image(),
            new Image(),
            new Image(),
            new Image(),
            new Image(),
            new Image(),
            new Image(),
            new Image(),
        ]
        for(let i = 0; i < this.desktopIcons.length-1; i++){
            this.desktopIcons[i].src = `Assets/desktop icons/DesktopIcon (${i}).png`
        }
        this.music_playing = false;
        this.desktopBG = new Image();
        this.desktopBG.src = 'Assets/03-Blue_Purple_LM-4K.png';
        this.playedAbity = false;

        this.mainImageLinks = {
            'ui':'Assets/Backgrounds/Base UI.png',
            'settings':'Assets/Backgrounds/Base Settings (1).png',
            'color_long':'Assets/Backgrounds/color_long.png',
            'color_short':'Assets/Backgrounds/color_short.png',
            'grayscale_short':'Assets/Backgrounds/grayscale_short.png',
            'title':'Assets/Backgrounds/Title screen.png',
            'bsod':'Assets/Backgrounds/BSOD.png',
            'dragon':'Assets/dragon.png',
            'modifiers':'Assets/Backgrounds/modifier_screen.png',
            'fireball':'Assets/fireball.png',
            'mega-fireball':'Assets/fireball2.png',
        }
        this.mainImages = {
            'ui':new Image(),
            'settings':new Image(),
            'color_long':new Image(),
            'color_short':new Image(),
            'grayscale_short':new Image(),
            'title':new Image(),
            'fireball':new Image(),
            'dragon':new Image(),
            'mega-fireball':new Image(),
            'bsod':new Image(),
            'modifiers':new Image(),
        }
        for(let file in this.mainImages){
            this.mainImages[file].src = this.mainImageLinks[file];
        }
        
        

        // The fun stuff
        this.blocks = [];
        this.dragon = new Dragon(this.program,this.Draw,new Vector(400,500),this.mainImages);    
        this.dragon.megaabilty.connect(()=>{
            if(this.playedAbity === false){
                this.playedAbity = true;
                this.narrator.play('new ability 2',this.settings.volume.narrator)
            }
        })

        this.timers = {
            'Runtime':[0,0,false,new Signal()],
            'fallTimer':[0,0.5,true,new Signal()],
            'AITimer':[0,0.5,true,new Signal()],
            'spawnBlock':[0,0.05,true,new Signal()],
            'session':[0,0,false,new Signal()],
            'cooldown':[-5,0,false,new Signal()],
        }
        this.timers['fallTimer'][3].connect(()=>{if(this.timers['cooldown'][0]>0)this.moveTetromino()})
        this.timers['AITimer'][3].connect(()=>{this.updateAI();})
        this.timers['spawnBlock'][3].connect(()=>{this.spawnRandomBlock()})
        this.lineMessages = [];
        this.narratorMessages = [];
        this.scene = 'title';
        
        this.modifiers = [false,false,false,false,false,false];
        this.chatMessages = [];
        this.dragon.power = 0.2;
        this.aiScore = 0;
        // Tetris AI
        this.states = {}
        this.createUI()
        this.narratorCooldown = 0;
        this.narrator.loadSound('WhatIsThis1','Assets/narator/WhatIsThis1.wav');
        this.loadNarrator()
        this.loadMusic()
        this.loadSound()
    }
 
    createUI(){
        this.elements = [];
        // Title scene
        let startButton = new UIButton(this.program,new Vector(660,462),new Vector(600,200),1,'Enter','#FF000000','#FFFFFF33','#00000055')
        let modifierButton = new UIButton(this.program,new Vector(660,720),new Vector(600,190),1,null,'#FF000000','#FFFFFF33','#00000055')
        
        startButton.onPressed.left.connect(async ()=>{
            this.scene = 'game';
            startButton.visible = false;
            modifierButton.visible = false; 
            this.conductor.reset()
            this.conductor.setVolume(this.settings.volume.music,3)
            await this.narrator.playSequence(['WhatIsThis1','This isnt dungions & dragons 2'],this.settings.volume.narrator); 
        })

        modifierButton.onPressed.left.connect(()=>{this.scene = 'modifiers'; modifierButton.visible = false; startButton.visible = false})

        // Pause menu
        this.pauseMenu = new Menu(this.program,new Vector(0,0),new Vector(0,0),2,'#400000ff');
        this.pauseMenu.addElement('Base',new UIImage(this.mainImages['settings'],new Vector(0,0),new Vector(1920,1080),2));
        this.pauseMenu.visible = false;
        // Modifier menu
        this.modifierMenu = new Menu(this.program, new Vector(0,0),new Vector(0,0),1,'#00000000') 

        let mod1 = new UIButton(this.program,new Vector(98,295),new Vector(530,300),1,'Enter','#FF000000','#FFFFFF33','#00000088')
        let mod2 = new UIButton(this.program,new Vector(690,295),new Vector(540,300),1,'Enter','#FF000000','#FFFFFF33','#00000088')
        let mod3 = new UIButton(this.program,new Vector(1290,295),new Vector(540,300),1,'Enter','#FF000000','#FFFFFF33','#00000088')
        let mod4 = new UIButton(this.program,new Vector(98,660),new Vector(530,330),1,'Enter','#FF000000','#FFFFFF33','#00000088')
        let mod5 = new UIButton(this.program,new Vector(690,660),new Vector(540,330),1,'Enter','#FF000000','#FFFFFF33','#00000088')
        let mod6 = new UIButton(this.program,new Vector(1285,660),new Vector(540,330),1,'Enter','#FF000000','#FFFFFF33','#00000088')
        mod1.trigger = true;
        mod2.trigger = true;
        mod3.trigger = true;
        mod4.trigger = true;
        mod5.trigger = true;
        mod6.trigger = true;
        mod1.onTrigger.connect((e)=>{e?this.modifiers[0]= true :this.modifiers[0]=false;this.restart()})
        mod2.onTrigger.connect((e)=>{e?this.modifiers[1]= true :this.modifiers[1]=false;this.restart()})
        mod3.onTrigger.connect((e)=>{e?this.modifiers[2]= true :this.modifiers[2]=false;this.restart()})
        mod4.onTrigger.connect((e)=>{e?this.modifiers[3]= true :this.modifiers[3]=false;this.restart()})
        mod5.onTrigger.connect((e)=>{e?this.modifiers[4]= true :this.modifiers[4]=false;this.restart()})
        mod6.onTrigger.connect((e)=>{e?this.modifiers[5]= true :this.modifiers[5]=false;this.restart()})

        let mbackButton = new UIButton(this.program,new Vector(210,85),new Vector(300,120),1,null,'#FF000000','#FFFFFF33','#00000055')
        mbackButton.trigger = true;
        mbackButton.onTrigger.connect((e)=>{this.scene = 'title'; startButton.visible=true; modifierButton.visible = true;})

        let mRect1 = new UIRect(new Vector(98,295),new Vector(530,300),1,'#00AA0044')
        let mRect2 = new UIRect(new Vector(690,295),new Vector(540,300),1,'#00AA0044')
        let mRect3 = new UIRect(new Vector(1290,295),new Vector(540,300),1,'#00AA0044')
        let mRect4 = new UIRect(new Vector(98,660),new Vector(530,330),1,'#00AA0044')
        let mRect5 = new UIRect(new Vector(690,660),new Vector(540,330),1,'#00AA0044')
        let mRect6 = new UIRect(new Vector(1285,660),new Vector(540,330),1,'#00AA0044')
        mRect1.visible = this.gameData.rewards[0];
        mRect2.visible = this.gameData.rewards[1];
        mRect3.visible = this.gameData.rewards[2];
        mRect4.visible = this.gameData.rewards[3];
        mRect5.visible = this.gameData.rewards[4];
        mRect6.visible = this.gameData.rewards[5];

        this.modifierMenu.addElement('Mod1',mod1);
        this.modifierMenu.addElement('Mod2',mod2);
        this.modifierMenu.addElement('Mod3',mod3);
        this.modifierMenu.addElement('Mod4',mod4);
        this.modifierMenu.addElement('Mod5',mod5);
        this.modifierMenu.addElement('Mod6',mod6);
        this.modifierMenu.addElement('rect1',mRect1);
        this.modifierMenu.addElement('rect2',mRect2);
        this.modifierMenu.addElement('rect3',mRect3);
        this.modifierMenu.addElement('rect4',mRect4);
        this.modifierMenu.addElement('rect5',mRect5);
        this.modifierMenu.addElement('rect6',mRect6);
        this.modifierMenu.addElement('Back',mbackButton);



        let closeButton = new UIButton(this.program,new Vector(1725,50),new Vector(145,135),3,'Escape','#00000000','#FFFFFF33','#00000055');
        closeButton.onPressed.left.connect(()=>{this.pauseMenu.visible = false;})
        let openButton = new UIButton(this.program,new Vector(1725,50),new Vector(145,135),1,'Escape','#00000000','#FFFFFF33','#00000055');
        openButton.onPressed.left.connect(()=>{this.pauseMenu.visible = true;});
        this.pauseMenu.addElement('closeButton',closeButton);

        
        let exitButton = new UIButton(this.program,new Vector(1250,935),new Vector(304,95),3,'Backspace','#00000000','#FFFFFF33','#00000055')
        exitButton.onPressed.left.connect(()=>{
            this.pauseMenu.visible = false; 
            this.scene = 'title'; 
            modifierButton.visible = true; 
            startButton.visible = true; 
            this.restart();
            this.conductor.setVolume(0,3)
        })
        
        let musicSlider = new UISlider(this.program,new Vector(1310,275),new Vector(540,40),3,'scalar',this.settings.volume.music,0,3,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        musicSlider.onChange.connect((a)=>{
            this.settings.volume.music = Math.max(a**2,0); 
            this.conductor.setVolume(Math.max(a**2,0));
        })
        this.pauseMenu.addElement('musicSlider',musicSlider)

        let sfxSlider = new UISlider(this.program,new Vector(1310,330),new Vector(540,40),3,'scalar',this.settings.volume.sfx,0,3,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        sfxSlider.onChange.connect((a)=>{
            this.settings.volume.sfx = Math.max(a**2,0); 
            this.soundGuy.setVolume('place',Math.max(a**2,0));
            this.soundGuy.setVolume('rotate',Math.max(a**2,0));
            this.soundGuy.setVolume('lineclear',Math.max(a**2,0));
            this.soundGuy.setVolume('fireball',Math.max(a**2,0));
            this.soundGuy.setVolume('break',Math.max(a**2,0));
        })
        this.pauseMenu.addElement('sfxSlider',sfxSlider)

        let narSlider = new UISlider(this.program,new Vector(1310,390),new Vector(540,40),3,'scalar',this.settings.volume.narrator,0,3,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        narSlider.onChange.connect((a)=>{
            this.settings.volume.narrator = Math.max(a**2,0); 
            this.soundGuy.setVolume('narrator',Math.max(a**2,0));
        })
        this.pauseMenu.addElement('narSlider',narSlider)

        let particleSlider = new UISlider(this.program,new Vector(1314,533),new Vector(540,45),3,'scalar',this.settings.particles,0,1,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        particleSlider.onChange.connect((e)=>{
            this.settings.particles = e
        })
        this.pauseMenu.addElement('particleSlider',particleSlider)

        let dangerColorSlider = new UISlider(this.program,new Vector(1310,600),new Vector(540,42),3,'color',new Color(0,1,1,1,'hsv'),0,0,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        dangerColorSlider.colorMode = 'a'
        dangerColorSlider.onChange.connect((e)=>{
            this.settings.colors.danger = e
        })
        this.pauseMenu.addElement('dangerColorSlider',dangerColorSlider)

        let blockColorSlider = new UISlider(this.program,new Vector(1310,665),new Vector(540,44),3,'color',new Color(0.59,1,0.36,1,'hsv'),0,0,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        blockColorSlider.colorMode = 'a'
        blockColorSlider.onChange.connect((e)=>{
            this.settings.colors.blocks = e
        })
        this.pauseMenu.addElement('blockColorSlider',blockColorSlider)
        
        let gridColorSlider = new UISlider(this.program,new Vector(1310,730),new Vector(540,44),3,'color',this.settings.colors.grid,0,0,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        gridColorSlider.colorMode = 'd'
        gridColorSlider.onChange.connect((e)=>{
            this.settings.colors.grid = e
        })
        this.pauseMenu.addElement('gridColorSlider',gridColorSlider)

        let timerColorSlider = new UISlider(this.program,new Vector(1310,795),new Vector(540,44),3,'color',this.settings.colors.timer,0,0,'#00000000','#FFFFFF22','#00000055','#FFFFFF33')
        timerColorSlider.colorMode = 'd'
        timerColorSlider.onChange.connect((e)=>{
            this.settings.colors.timer = e
        })
        this.pauseMenu.addElement('timerColorSlider',timerColorSlider)

        this.pauseMenu.addElement('exitButton',exitButton)
        this.bsodYesButton = new UIButton(this.program,new Vector(735,772),new Vector(95,45),1,null,'#FF000000','#FFFFFF33','#00000055')
        this.bsodYesButton.onPressed.left.connect(()=>{
            this.scene = 'title';
            this.bsodYesButton.visible = false;
            startButton.visible=true;
            modifierButton.visible = true;
            for(let i = 0; i<6; i++){
                if(this.modifiers[i]){
                    this.saver.gameData.rewards[i] = true;
                }
            }
            mRect1.visible = this.gameData.rewards[0];
            mRect2.visible = this.gameData.rewards[1];
            mRect3.visible = this.gameData.rewards[2];
            mRect4.visible = this.gameData.rewards[3];
            mRect5.visible = this.gameData.rewards[4];
            mRect6.visible = this.gameData.rewards[5];
        })
        this.bsodNoButton = new UIButton(this.program,new Vector(850,772),new Vector(90,45),1,null,'#FF000000','#FFFFFF33','#00000055')
        this.bsodNoButton.onPressed.left.connect(()=>{
            this.scene = 'title';
            this.bsodNoButton.visible = false;
            startButton.visible=true;
            modifierButton.visible = true;
            for(let i = 0; i<6; i++){
                if(this.modifiers[i]){
                    this.gameData.rewards[i] = true;
                }
            }
            this.saver.set('game/rewards',this.gameData.rewards);
            mRect1.visible = this.gameData.rewards[0];
            mRect2.visible = this.gameData.rewards[1];
            mRect3.visible = this.gameData.rewards[2];
            mRect4.visible = this.gameData.rewards[3];
            mRect5.visible = this.gameData.rewards[4];
            mRect6.visible = this.gameData.rewards[5];
        })
        this.bsodYesButton.visible = false;
        this.bsodNoButton.visible = false;
        this.elements.push(openButton)
        this.elements.push(startButton)
        this.elements.push(modifierButton)
        this.elements.push(this.bsodYesButton);
        this.audio = 0;
        this.elements.push(this.bsodNoButton)
        this.elements.push(this.modifierMenu);
        this.elements.push(this.pauseMenu);

    }

    async loadMusic(){
        await this.musician.loadSound('intro',"Assets/sounds/Dragons don't like tetris p1.wav");
        await this.musician.loadSound('part1',"Assets/sounds/Dragons don't like tetris p2.wav");
        await this.musician.loadSound('part2',"Assets/sounds/Dragons don't like tetris p3.wav");
        await this.musician.loadSound('part3',"Assets/sounds/Dragons don't like tetris p4.wav");
        await this.musician.loadSound('part4',"Assets/sounds/Dragons don't like tetris p5.wav");
        await this.musician.loadSound('segue',"Assets/sounds/Dragons don't like tetris p6.wav");
        await this.musician.loadSound('part5',"Assets/sounds/Dragons don't like tetris p7.wav");
        this.conductor.setSections([
            { name: "intro", loop: false },
            { name: "part1", loop: true },
            { name: "part2", loop: true },
            { name: "part3", loop: true },
            { name: "part4", loop: true },
            { name: "segue", loop: false },
            { name: "part5", loop: false }
        ]);
        this.conductor.setCondition(1, () => this.dragon.power>=1);
        this.conductor.setCondition(2, () => this.dragon.power>=2);
        this.conductor.setCondition(3, () => this.dragon.power>=3);
        this.conductor.setCondition(4, () => this.dragon.power>=5);
        
        // Start playback
        this.conductor.start(this.settings.volume.music);
    }

    async loadSound(){
        await this.soundGuy.loadSound('fireball','Assets/sounds/fireball_hit.wav')
        await this.soundGuy.loadSound('crash','Assets/sounds/crash.wav')
        await this.soundGuy.loadSound('break','Assets/sounds/break.wav')
        await this.soundGuy.loadSound('place','Assets/sounds/place.wav')
        await this.soundGuy.loadSound('rotate','Assets/sounds/rotate.wav')
        await this.soundGuy.loadSound('lineclear','Assets/sounds/lineclear.wav')
        this.soundGuy.play('music',this.settings.volume.music,true)
    }

    async loadNarrator(){
        await this.narrator.loadSound('WhatIsThis2'                   ,'Assets/narator/WhatIsThis2.wav');
        await this.narrator.loadSound('This isnt dungions & dragons 1',"Assets/narator/This isn't dungions & dragons 1.wav");
        await this.narrator.loadSound('This isnt dungions & dragons 2',"Assets/narator/This isn't dungions & dragons 2.wav");
        await this.narrator.loadSound('Stop destroying the blocks 1'  ,'Assets/narator/Stop destroying the blocks 1.wav');
        await this.narrator.loadSound('Stop destroying the blocks 2'  ,'Assets/narator/Stop destroying the blocks 2.wav');
        await this.narrator.loadSound('Stop destroying the blocks 3'  ,'Assets/narator/Stop destroying the blocks 3.wav');
        await this.narrator.loadSound('bigger fireballs 2'            ,'Assets/narator/bigger fireballs 2.wav')
        await this.narrator.loadSound('bigger fireballs'              ,'Assets/narator/bigger fireballs.wav')
        await this.narrator.loadSound('Are you getting stronger'      ,'Assets/narator/Are you getting stronger.wav')
        await this.narrator.loadSound('disappear 7'                   ,'Assets/narator/disappear 7.wav');
        await this.narrator.loadSound('disappear 2'                   ,'Assets/narator/disappear 2.wav')
        await this.narrator.loadSound('disappear 3'                   ,'Assets/narator/disappear 3.wav')
        await this.narrator.loadSound('disappear 4'                   ,'Assets/narator/disappear 4.wav')
        await this.narrator.loadSound('disappear 5'                   ,'Assets/narator/disappear 5.wav');
        await this.narrator.loadSound('disappear 6'                   ,'Assets/narator/disappear 6.wav');
        await this.narrator.loadSound('disappear 8'                   ,'Assets/narator/disappear 8.wav');
        await this.narrator.loadSound('disappear 9'                   ,'Assets/narator/disappear 9.wav');
        await this.narrator.loadSound('disappear'                     ,'Assets/narator/disappear.wav');
        await this.narrator.loadSound('dont crash my pc 2'            ,'Assets/narator/dont crash my pc 2.wav');
        await this.narrator.loadSound('dont crash my pc'              ,'Assets/narator/dont crash my pc.wav');
        await this.narrator.loadSound('dragon left'                   ,'Assets/narator/dragon left.wav');
        await this.narrator.loadSound('eyes wide open'                ,'Assets/narator/eyes wide open.wav');
        await this.narrator.loadSound('Go away 2'                     ,'Assets/narator/Go away 2.wav');
        await this.narrator.loadSound('Go away 3'                     ,'Assets/narator/Go away 3.wav');
        await this.narrator.loadSound('Go away'                       ,'Assets/narator/Go away.wav');
        await this.narrator.loadSound('mule'                          ,'Assets/narator/mule.wav');
        await this.narrator.loadSound('new ability 2'                 ,'Assets/narator/new ability 2.wav');
        await this.narrator.loadSound('new ability 3'                 ,'Assets/narator/new ability 3.wav');
        await this.narrator.loadSound('new ability'                   ,'Assets/narator/new ability.wav');
        await this.narrator.loadSound('no! 2'                         ,'Assets/narator/no! 2.wav');
        await this.narrator.loadSound('no! 3'                         ,'Assets/narator/no! 3.wav');
        await this.narrator.loadSound('no!'                           ,'Assets/narator/no!.wav');
        await this.narrator.loadSound('break everything'              ,'Assets/narator/Seriously, are you going to break everything.wav');
        await this.narrator.loadSound('speedrun 1'                    ,'Assets/narator/speedrun 1.wav');
        await this.narrator.loadSound('speedrun 2'                    ,'Assets/narator/speedrun 2.wav');
        await this.narrator.loadSound('success'                       ,'Assets/narator/success.wav');
        await this.narrator.loadSound('tetris 2'                      ,'Assets/narator/tetris 2.wav');
        await this.narrator.loadSound('tetris'                        ,'Assets/narator/tetris.wav');
        await this.narrator.loadSound('thats great 2'                 ,'Assets/narator/thats great 2.wav');
        await this.narrator.loadSound('thats great 3'                 ,'Assets/narator/thats great 3.wav');
        await this.narrator.loadSound('thats great'                   ,'Assets/narator/thats great.wav');
        await this.narrator.loadSound('why 2'                         ,'Assets/narator/why 2.wav');
        await this.narrator.loadSound('why'                           ,'Assets/narator/why.wav');
    }

    setUpBoard(){
        this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
    }
    /** Types: move,fall */
    moveTetromino(type='fall',data=new Vector(0,1)){
        if(this.modifiers[5]){
            if(type==='fall'){
                for(let i = 0; i < 2; i++){
                    if (this.activeTetromino === null||this.dragon.power>5){
                        return false;
                    }
                    
                    let canMove = true;
                    for (let part of this.activeTetromino.getPositions()){
                        if (this.checkSpot(part.add(data)) || !this.checkBounds(part.add(data))){
                            canMove = false;
                        }
                    }
                    if(canMove){
                        this.justSpawned = false;
                        for (let part of this.activeTetromino.getPositions()){
                            this.modifySpot(part,0)
                        }
                        this.activeTetromino.pos.addS(data)
                        for (let part of this.activeTetromino.getPositions()){
                            this.modifySpot(part,2)
                        }
                    }else if(type === 'fall'){
                        for (let part of this.activeTetromino.getPositions()){
                            this.modifySpot(part,1)
                        } 
                        if(this.justSpawned){
                            this.clearBoard();
                            this.resets+=1
                            if(this.narratorCooldown<=0){
                                message = Math.floor(Math.random()*3)
                                if(message === 0){
                                    this.narrator.play('no!', this.settings.volume.narrator)
                                }else{
                                    this.narrator.play(`no! ${message}`, this.settings.volume.narrator)
                                }
                                this.narratorCooldown = 2;

                            }
                        }
                        this.activeTetromino = new Tetromino('random');
                        this.justSpawned = true;
                        this.soundGuy.play('place')
                        this.aiTarget = null;
                        for (let part of this.activeTetromino.getPositions()){
                            this.modifySpot(part, 2);
                        }
                    }
                }
            }
        }
        if (this.activeTetromino === null||this.dragon.power>5){
            return false;
        }
        
        let canMove = true;
        for (let part of this.activeTetromino.getPositions()){
            if (this.checkSpot(part.add(data)) || !this.checkBounds(part.add(data))){
                canMove = false;
            }
        }
        if(canMove){
            this.justSpawned = false;
            for (let part of this.activeTetromino.getPositions()){
                this.modifySpot(part,0)
            }
            this.activeTetromino.pos.addS(data)
            for (let part of this.activeTetromino.getPositions()){
                this.modifySpot(part,2)
            }
        }else if(type === 'fall'){
            for (let part of this.activeTetromino.getPositions()){
                this.modifySpot(part,1)
            } 
            if(this.justSpawned){
                this.resets+=1
                this.clearBoard();
                if(this.narratorCooldown<=0){
                    message = Math.floor(Math.random()*3)
                    if(message === 0){
                        this.narrator.play('no!', this.settings.volume.narrator)
                    }else{
                        this.narrator.play(`no! ${message}`, this.settings.volume.narrator)
                    }
                    this.narratorCooldown = 2;

                }
            }
            this.activeTetromino = new Tetromino('random');
            this.justSpawned = true;
            this.soundGuy.play('place')
            this.aiTarget = null;
            for (let part of this.activeTetromino.getPositions()){
                this.modifySpot(part, 2);
            }
        }

    }

    clearBoard(){
        this.board = [];
        this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
        this.aiScore = 0;
        this.lineMessages.push('Stack overflow. Restarting...')
        this.dragon.power*=1.03
    }

    rotateTetromino(dir=1){
        if (this.activeTetromino === null){
            return false;
        }
        
        let canMove = true;
        for (let part of this.activeTetromino.getPositions(dir)){
            if (this.checkSpot(part) || !this.checkBounds(part)){
                canMove = false;
            }
        }
        if(canMove){
            for (let part of this.activeTetromino.getPositions(0)){
                this.modifySpot(part,0)
            }
            for (let part of this.activeTetromino.getPositions(dir)){
                this.modifySpot(part,2)
            }
            this.soundGuy.play('rotate')
            this.activeTetromino.rotate(1)
        }

    }      

    getBestMove(tetromino) {
        let bestScore = -Infinity;
        let bestMove = {x: 0, rotation: 0};

        // Test all rotations
        for (let r = 0; r < 4; r++) {
            let testTet = new Tetromino(tetromino.type);
            testTet.rotation = tetromino.rotation + r * Math.PI/2;

            // Test all horizontal positions
            for (let x = -5; x < 10; x++) {
                testTet.pos = new Vector(4 + x, 0);
                
                // Drop tetromino to the bottom
                while (!this.checkCollision(testTet, new Vector(0,1))) {
                    testTet.pos.y += 1;
                }

                let score = this.evaluateBoard(testTet);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {x: testTet.pos.x - tetromino.pos.x, rotation: r};
                }
            }
        }

        return bestMove;
    }

    checkCollision(tetromino, delta) {
        for (let part of tetromino.getPositions()) {
            let nextPos = part.add(delta);
            if (!this.checkBounds(nextPos) || this.checkSpot(nextPos)) return true;
        }
        return false;
    }

    evaluateBoard(tetromino) {
        // Simulate the tetromino on a temporary board
        let tempBoard = this.board.map(row => row.slice());
        let edgesTouching = 0;

        for (let pos of tetromino.getPositions()) {
            let x = Math.round(pos.x);
            let y = Math.round(pos.y);
            if (y >= 0 && y < tempBoard.length && x >= 0 && x < tempBoard[0].length) {
                tempBoard[y][x] = 1;

                // Check edges touching other blocks or walls
                let neighbors = [
                    [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
                ];
                for (let [nx, ny] of neighbors) {
                    if (nx < 0 || nx >= 10 || (ny >= 0 && ny < 20 && tempBoard[ny][nx] === 1)) {
                        edgesTouching++;
                    }
                }
            }
        }

        let holes = 0;
        let overhangPenalty = 0;
        let fullLines = 0;
        let partialLineBonus = 0;
        let multiLineBonus = 0;
        let iColumnPenalty = 0;
        let heights = Array(10).fill(0);

        for (let x = 0; x < 10; x++) {
            let blockFound = false;
            let gapHeight = 0;
            for (let y = 0; y < 20; y++) {
                if (tempBoard[y][x] === 1) blockFound = true;
                else if (blockFound && tempBoard[y][x] === 0) {
                    holes++;
                    overhangPenalty += (20 - y) * 2; // double penalty for overhangs
                }

                if (tempBoard[y][x] === 0) gapHeight++;
                else {
                    if (gapHeight >= 1) iColumnPenalty += gapHeight * 3; // punish any overhang gaps heavily
                    gapHeight = 0;
                }

                if (x === 0) {
                    let row = tempBoard[y];
                    let filled = row.reduce((a, c) => a + (c ? 1 : 0), 0);

                    if (filled === 10) fullLines++;
                    else if (filled >= 7 && filled < 10) multiLineBonus += filled;

                    let maxRun = 0, currentRun = 0;
                    for (let i = 0; i < row.length; i++) {
                        if (row[i] === 1) currentRun++;
                        else currentRun = 0;
                        if (currentRun > maxRun) maxRun = currentRun;
                    }
                    partialLineBonus += maxRun;
                }

                if (tempBoard[y][x] === 1 && heights[x] === 0) {
                    heights[x] = 20 - y;
                }
            }
            if (gapHeight >= 1) iColumnPenalty += gapHeight * 3;
        }

        // Calculate bumpiness & aggregate height
        let aggregateHeight = heights.reduce((a, b) => a + b, 0);
        let bumpiness = heights.reduce((acc, h, i, arr) => i > 0 ? acc + Math.abs(h - arr[i - 1]) : acc, 0);

        // Well analysis
        let wellScore = 0;
        for (let x = 0; x < 10; x++) {
            let leftHeight = x === 0 ? 20 : heights[x - 1];
            let rightHeight = x === 9 ? 20 : heights[x + 1];
            if (heights[x] < leftHeight && heights[x] < rightHeight) {
                let wellDepth = Math.min(leftHeight, rightHeight) - heights[x];
                if ((leftHeight - heights[x] === 1) && (rightHeight - heights[x] === 1)) {
                    wellScore -= 10 * wellDepth; // punish 1-wide wells more
                } else if ((leftHeight - heights[x] >= 2 && rightHeight - heights[x] >= 2)) {
                    wellScore += 3 * wellDepth; // slightly favor 2+ wide wells
                }
            }
        }

        // Heuristic scoring
        let score = (fullLines ** 2) * 500
                + (multiLineBonus * 10)
                + (partialLineBonus * 5)
                + (edgesTouching * 20)
                - (holes * 800)               // stronger hole penalty
                - (overhangPenalty)      // heavy overhang penalty
                - (aggregateHeight * 5)
                - (bumpiness * 5)
                - (iColumnPenalty * 5)        // heavily punish small gaps under blocks
                + wellScore
                - Math.abs(4.5 - tetromino.pos.x) * 2;

        return score;
    }  

    spawnRandomBlock(){
        if(this.timers['session'][0]>300){
            this.board[Math.floor(Math.min(Math.random()*(this.timers['session'][0]-300)/16,19))][Math.floor(Math.random()*10)] = 10
        }
    }

    updateAI(){
        if(this.timers['cooldown'][0]>=0){
            if(this.modifiers[5]){
                this.applyBestMove();
                this.applyBestMove();
                this.applyBestMove();
                this.applyBestMove();
                this.applyBestMove();
                this.applyBestMove();
                this.applyBestMove();
                this.applyBestMove();
                this.applyBestMove();
                this.applyBestMove();
            }
            this.applyBestMove();
        }
    }

    applyBestMove() {
        if (!this.activeTetromino) return;
        if (!this.aiTarget) {
            this.aiTarget = this.getBestMove(this.activeTetromino);
            this.aiStepX = this.aiTarget.x;
            this.aiStepR = this.aiTarget.rotation;
        }

        // Rotate first
        if (this.aiStepR > 0) {
            this.rotateTetromino();
            this.aiStepR--;
            return;
        }

        // Move horizontally
        if (this.aiStepX < 0) {
            this.moveTetromino('move', new Vector(-1,0));
            this.aiStepX++;
            return;
        } else if (this.aiStepX > 0) {
            this.moveTetromino('move', new Vector(1,0));
            this.aiStepX--;
            return;
        }
        
        // Once horizontal and rotation are done, let gravity handle falling
    }

    updateBoard() {
        if(this.dragon.power>5){
            return;
        }
        for (let y = 0; y < this.board.length; y++) {
            for (let x = 0; x < this.board[y].length; x++) {
                if (this.board[y][x] <= 0){ 
                    this.board[y][x] = 0;
                    continue;
                }
                let tileX = x * this.gridSize.x / 10 + this.gridPos.x;
                let tileY = y * this.gridSize.y / 20 + this.gridPos.y;
                let tileW = this.gridSize.x / 10;
                let tileH = this.gridSize.y / 20;
                
                

                for(let fireball of this.dragon.fireballs){
                    if(!fireball) continue;
                    if(Geometry.rectCollide(fireball.pos,fireball.size,new Vector(tileX,tileY),new Vector(tileW,tileH))){
                        this.board[y][x] -= Math.max(fireball.power,0);
                        if(this.board[y][x]<=0){
                            this.board[y][x]=0
                            this.soundGuy.play('break')
                            this.saver.set('game/blocks',this.saver.get('game/blocks')+1)
                            this.sessionBlocks+=1
                            this.dragon.anger+=0.002;
                            if(this.dragon.anger>1){
                                this.dragon.anger = 1;
                            }
                        }
                        fireball.power-=0.5;
                        for(let i = 0; i< 10; i++){
                            if(Math.random()>this.settings.particles){
                                continue;
                            }
                            let fragment = new Fragment(
                                this.Draw,
                                fireball.pos.add(fireball.size.mult(0.5)),
                                fireball.power
                            )
                            fragment.destroy.connect(() => {
                                this.particles = this.particles.filter(item => item !== fragment);
                            })
                            this.particles.push(fragment)
                            if(this.particles.length>200){
                                this.particles.shift()
                            }
                        }
                    }
                }


                // --- Horizontal collisions ---
                // Right side
                let collided = false
                if(this.dragon.power < 3){
                    if (this.dragon.pos.x + this.dragon.vlos.x + this.dragon.size.x >= tileX &&
                        this.dragon.pos.x <= tileX &&
                        this.dragon.pos.y + this.dragon.size.y - 2 > tileY &&
                        this.dragon.pos.y + 2 < tileY + tileH
                    ) {
                        this.dragon.pos.x = tileX - this.dragon.size.x;
                        this.dragon.vlos.x *= 0.0001;
                        collided = true;
                    }
                    // Left side
                    if (this.dragon.pos.x + this.dragon.vlos.x <= tileX + tileW &&
                        this.dragon.pos.x + this.dragon.size.x >= tileX + tileW &&
                        this.dragon.pos.y + this.dragon.size.y - 2 > tileY &&
                        this.dragon.pos.y + 2 < tileY + tileH
                    ) {
                        this.dragon.pos.x = tileX + tileW;
                        this.dragon.vlos.x *= 0.0001;
                        collided = true;
                    }

                    // --- Vertical collisions ---
                    // Bottom (floor)
                    if (this.dragon.pos.y + this.dragon.vlos.y + this.dragon.size.y >= tileY &&
                        this.dragon.pos.y <= tileY &&
                        this.dragon.pos.x + this.dragon.size.x - 2 > tileX &&
                        this.dragon.pos.x + 2 < tileX + tileW
                    ) {
                        this.dragon.pos.y = tileY - this.dragon.size.y;
                        this.dragon.vlos.y *= -0.2;
                        collided = true;
                    }
                    // Top (ceiling)
                    if (this.dragon.pos.y + this.dragon.vlos.y <= tileY + tileH &&
                        this.dragon.pos.y + this.dragon.size.y >= tileY + tileH &&
                        this.dragon.pos.x + this.dragon.size.x - 2 > tileX &&
                        this.dragon.pos.x + 2 < tileX + tileW
                    ) {
                        this.dragon.pos.y = tileY + tileH;
                        this.dragon.vlos.y *= -0.2;
                        collided = true;
                    }
                }
                if(collided && this.board[y][x] >= 5){
                    this.dragon.health -=1;
                }
            }
        }
        for (let part of this.activeTetromino.getPositions()){
            let collided = false
            let tileX = part.x * this.gridSize.x / 10 + this.gridPos.x;
            let tileY = part.y * this.gridSize.y / 20 + this.gridPos.y;
            let tileW = this.gridSize.x / 10;
            let tileH = this.gridSize.y / 20;
            if(this.dragon.power < 3){
                if (this.dragon.pos.x + this.dragon.vlos.x + this.dragon.size.x >= tileX &&
                    this.dragon.pos.x <= tileX &&
                    this.dragon.pos.y + this.dragon.size.y - 2 > tileY &&
                    this.dragon.pos.y + 2 < tileY + tileH
                ) {
                    this.dragon.pos.x = tileX - this.dragon.size.x;
                    this.dragon.vlos.x *= 0.0001;
                    collided = true;
                }
                // Left side
                if (this.dragon.pos.x + this.dragon.vlos.x <= tileX + tileW &&
                    this.dragon.pos.x + this.dragon.size.x >= tileX + tileW &&
                    this.dragon.pos.y + this.dragon.size.y - 2 > tileY &&
                    this.dragon.pos.y + 2 < tileY + tileH
                ) {
                    this.dragon.pos.x = tileX + tileW;
                    this.dragon.vlos.x *= 0.0001;
                    collided = true;
                }

                // --- Vertical collisions ---
                // Bottom (floor)
                if (this.dragon.pos.y + this.dragon.vlos.y + this.dragon.size.y >= tileY &&
                    this.dragon.pos.y <= tileY &&
                    this.dragon.pos.x + this.dragon.size.x - 2 > tileX &&
                    this.dragon.pos.x + 2 < tileX + tileW
                ) {
                    this.dragon.pos.y = tileY - this.dragon.size.y;
                    this.dragon.vlos.y *= -0.2;
                    collided = true;
                }
                // Top (ceiling)
                if (this.dragon.pos.y + this.dragon.vlos.y <= tileY + tileH &&
                    this.dragon.pos.y + this.dragon.size.y >= tileY + tileH &&
                    this.dragon.pos.x + this.dragon.size.x - 2 > tileX &&
                    this.dragon.pos.x + 2 < tileX + tileW
                ) {
                    this.dragon.pos.y = tileY + tileH;
                    this.dragon.vlos.y *= -0.2;
                    collided = true;
                }
            }
            if(collided){
                this.dragon.health -=1;
                if(this.modifiers[5]){
                    this.dragon.health-=4
                }
                let message = Math.floor(Math.random()*10)
                if(this.narratorCooldown<=0){
                    if(message === 0){
                        this.narrator.play('disappear', this.settings.volume.narrator)
                    }else{
                        this.narrator.play(`disappear ${message}`, this.settings.volume.narrator)
                    }
                    this.narratorCooldown = 2;

                }
            }
        }
        this.lineClears()
        if(this.dragon.power<4){
            if(this.dragon.pos.y+this.dragon.size.y>this.gridPos.y+this.gridSize.y){
                this.dragon.pos.y = this.gridPos.y+this.gridSize.y - this.dragon.size.y;
                if(this.dragon.vlos.y > 0){
                    this.dragon.vlos.y =0
                }
            }
            if(this.dragon.pos.y<this.gridPos.y){
                this.dragon.pos.y = this.gridPos.y;
                if(this.dragon.vlos.y < 0){
                    this.dragon.vlos.y = 0
                }
            }
            if(this.dragon.pos.x+this.dragon.size.x>this.gridPos.x+this.gridSize.x){
                this.dragon.pos.x = this.gridPos.x+this.gridSize.x - this.dragon.size.x;
            }
            if(this.dragon.pos.x < this.gridPos.x){
                this.dragon.pos.x = this.gridPos.x;
            }
        }
    }

    lineClears(){
        let num = 0
        for (let y = 0; y < this.board.length; y++) {
            let scan = 0;
            for (let x = 0; x < this.board[y].length; x++) {
                if (this.checkSpot(new Vector(x, y))) scan += 1;
            }
            if (scan >= 10) {
                this.board.splice(y, 1);
                this.lines+=1;
                num+=1
                for (let y = 0; y < this.board.length; y++) {
                    for (let x = 0; x < this.board[y].length; x++) {
                        if (this.board[y][x] === 2) this.board[y][x]=0;
                }}
                this.board = [[0,0,0,0,0,0,0,0,0,0]].concat(this.board);
            }
        }
        if(num===1){
            this.lineMessages.push('Single. +40')
            this.aiScore += 40
            this.soundGuy.play('lineclear')
        }else
        if(num===2){
            this.lineMessages.push('Double. +100')
            this.aiScore += 100
            this.soundGuy.play('lineclear')
        }else
        if(num===3){
            this.lineMessages.push('Triple! +300')
            this.aiScore += 300
            this.soundGuy.play('lineclear')
        }else
        if(num===4){
            this.lineMessages.push('TETRIS!! +1200')
            this.aiScore += 1200
            this.narrator.playSequence(['tetris'],this.settings.volume.narrator)
            this.narratorCooldown = 1;
            this.soundGuy.play('lineclear')
        }
    }

    checkBounds(pos){
        if(Math.round(pos.y)>this.board.length-1){
            return false;
        }
        if(Math.round(pos.x)>this.board[Math.round(pos.y)].length-1){
            return false;
        }
        if(Math.round(pos.y)<0){
            return false;
        }
        if(Math.round(pos.x)<0){
            return false;
        }
        return true;
    }

    checkSpot(pos){
        if (!this.checkBounds(pos)){
            return false;
        }
        if(this.board[Math.round(pos.y)][Math.round(pos.x)]>0 && this.board[Math.round(pos.y)][Math.round(pos.x)]<=1){
            return true;
        }
        return false;
    }

    modifySpot(pos,data){
        if(!data && data !=0){
            return;
        }
        this.board[Math.round(pos.y)][Math.round(pos.x)] = data;
    }

    update(delta) {
        this.runtime += delta;
        this.delta = delta;
        this.narratorCooldown-=delta
        this.updateUI(delta);
        if(this.modifiers[4]){
            this.dragon.health += this.dragon.power*delta/10;
            if(this.dragon.health > this.dragon.power*10){
                this.dragon.health = this.dragon.power*10
            }
            if(this.dragon.power>2){
                this.dragon.health-=1;
                this.dragon.health += this.dragon.power*delta/5;
            }
        }
        if(this.modifiers[0]){
            this.dragon.fireballTimer = 10;
        }
        if(this.modifiers[1]){
            this.dragon.big = true;
        }
        if(this.modifiers[3]){
            this.dragon.heavy = true;
        }
        if(this.scene === 'modifiers'){
            this.modifierMenu.visible = true;
        }else{
            this.modifierMenu.visible = false;
        }
        if(this.sessionBlocks>25 && this.audio === 0  && this.narratorCooldown <=0){
            this.narrator.play('Stop destroying the blocks 1',this.settings.volume.narrator)
            this.audio +=1;
            this.narratorCooldown = 1;
        }
        if(this.sessionBlocks>50 && this.audio === 1  && this.narratorCooldown <=0){
            this.narrator.play('Stop destroying the blocks 2',this.settings.volume.narrator)
            this.audio +=1;
            this.narratorCooldown = 1;
        }
        if(this.sessionBlocks>75 && this.audio === 2  && this.narratorCooldown <=0){
            this.narrator.play('Stop destroying the blocks 3',this.settings.volume.narrator)
            this.audio +=1;
            this.narratorCooldown = 1;
        }
        if(this.dragon.power>=0.5 && this.audio === 3  && this.narratorCooldown <=0){
            this.narrator.playSequence(['bigger fireballs 2','thats great 3'],this.settings.volume.narrator)
            this.audio +=1;
            this.narratorCooldown = 1;
        }
        if(this.dragon.power>=1 && this.audio === 4  && this.narratorCooldown <=0){
            this.narrator.playSequence(['Are you getting stronger'],this.settings.volume.narrator)
            this.audio +=1;
            this.narratorCooldown = 1;
        }
        if(this.dragon.power>=4 && this.audio === 5  && this.narratorCooldown <=0){
            this.narrator.playSequence(['dragon left'],this.settings.volume.narrator)
            this.audio +=1;
            this.narratorCooldown = 1;
        }
        if(this.dragon.power>=5 && this.audio === 6  && this.narratorCooldown <=0){
            this.narrator.playSequence(['dont crash my pc'],this.settings.volume.narrator)
            this.audio +=1;
            this.narratorCooldown = 1;
        }
        if(this.sessionBlocks>300 && this.audio === 5  && this.narratorCooldown <=0){
            this.narrator.playSequence(['Stop destroying the blocks 2','success'],this.settings.volume.narrator)
            this.audio +=1;
            this.narratorCooldown = 1;
        }
        if(this.keys.pressed(']')){
            debug.log(this.mouse.pos)
        }
        if(this.scene === 'title' || this.scene === 'bsod' || this.scene === 'modifiers'){
            return;
        }
        
        for (let timer in this.timers){
            this.timers[timer][0]+=Math.round(delta*1000)/1000;
            if(this.timers[timer][2]){
                if(this.timers[timer][0] > this.timers[timer][1]){
                    this.timers[timer][3].emit()
                    this.timers[timer][0] = 0
                }
            }
        }
        
        
        
        if(this.dragon.power>5){
            this.timers['AITimer'][2] = false
            this.timers['fallTimer'][2] = false
            if(!this.loadedIcons){
                    for (let i = 0; i < this.desktopIcons.length-1; i++){
                        let block = new Appicon(this.Draw,new Vector(Math.random()*1720+100,Math.random()*880+100),new Vector(96*2,96*2),this.desktopIcons[i])
                        block.destroy.connect(()=>{
                            this.blocks = this.blocks.filter(item => item !== block);
                        })
                        this.blocks.push(block)
                    }
                    if(this.blocks.length>50){
                        this.loadedIcons = true;
                    }
                
            }
        }else{
            this.timers['AITimer'][1] = 1/Math.log10(Math.max(this.timers['session'][0],1))/10
            this.timers['fallTimer'][1] = 1/Math.log10(Math.max(this.timers['session'][0],1))/10
            if(this.modifiers[5]){
                this.timers['fallTimer'][1] = 0.05
                this.timers['AITimer'][1] = 0.025
            }
        }
        this.mouse.setPower(0);
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            for(let fireball of this.dragon.fireballs){
                if(Geometry.rectCollide(fireball.pos,fireball.size,this.blocks[i].pos,this.blocks[i].size)){
                    this.blocks[i].health-=fireball.power;
                    fireball.power-=0.5;
                }
            }
        }
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            if(this.blocks[i].health<0){
                this.blocks[i].adiós();
                continue;
            }
        }
        this.updateBoard()
        for(let fireball of this.dragon.fireballs){

                if(fireball.power <= 0){
                    this.dragon.power*=1.002
                    if(this.dragon.power<1){
                        this.soundGuy.play("fireball")
                    }else{
                        this.soundGuy.play("fireball",0.3)
                    }
                    fireball.adiós('destroy')
                }
            
        }
        for(let i = this.particles.length-1; i>0; i--){
            this.particles[i].update(delta);
        }
        if(this.dragon.health<=0){
            this.narrator.play(`Go away 2`,this.settings.volume.narrator)
            this.restart();
            this.deaths +=1
        }
        if(this.modifiers[2]&&this.timers['session']>400){
            this.deaths+=1;
            this.restart();
        }

        if(this.lineMessages.length>15){
            this.lineMessages.shift()
        }
        
        if (this.soundGuy.audioCtx.state === "suspended") {
            this.soundGuy.audioCtx.resume();
        }
        if(this.blocks.length===0 && this.loadedIcons){
            this.loadedIcons = false;
            this.restart()
            this.narrator.playSequence(['mule'],this.settings.volume.narrator)
            this.narratorCooldown = 1;
            this.scene = 'bsod'
            this.lineMessages = []
            this.bsodNoButton.visible = true;
            this.bsodYesButton.visible = true;
            
        }
        if(this.keys.pressed('/')){
            this.dragon.power +=0.1;
        }
        if(this.keys.pressed('v')){
            this.dragon.health += 1
        }

        
    }

    restart(){
        this.activeTetromino = new Tetromino('J');
        this.aiTarget = null;
        this.sessionBlocks = 0;
        this.audio = 0;
        this.clearBoard();
        this.dragon = new Dragon(this.program,this.Draw,new Vector(400,500),this.mainImages);
        this.dragon.megaabilty.connect(()=>{
            if(this.playedAbity === false){
                this.playedAbity = true;
                this.narrator.play('new ability 2',this.settings.volume.narrator)
            }
        })
        if(this.modifiers[4]){
            this.dragon.health = 0;
        }
        this.timers['session'][0] = 0;
        this.timers['fallTimer'][2] = true;
        this.playedAbity = false;
        this.timers['AITimer'][2] = true;
        
        this.blocks = [];
        this.timers['cooldown'][0] = -3;
    }

    drawGrid(){
        if(this.dragon.power > 5){
            return;
        }
        this.gridScale = new Vector(0.9,0.9)
        this.gridSize = new Vector(1080/2*this.gridScale.x,1080*this.gridScale.y)
        this.gridPos = new Vector(1920/2-this.gridSize.x/2,1080/2-this.gridSize.y/2);
        for (let i = 0; i< 11; i++){
            this.Draw.line(this.gridPos.add(new Vector(i*this.gridSize.x/10,0)),this.gridPos.add(new Vector(i*this.gridSize.x/10,this.gridSize.y)),this.settings.colors.grid.toHex(),5)
        }
        for (let i = 0; i< 21; i++){
            this.Draw.line(this.gridPos.add(new Vector(0,i*this.gridSize.x/10)),this.gridPos.add(new Vector(this.gridSize.x,i*this.gridSize.x/10)),this.settings.colors.grid.toHex(),5)
        }
        for (let y = 0; y < this.board.length; y++){
            for (let x = 0; x < this.board[y].length; x++){
                
                if(this.board[y][x]<=0) continue;
                if(this.board[y][x] < 2){
                    this.Draw.rect(new Vector(x*this.gridSize.x/10 + this.gridPos.x, y*this.gridSize.y/20 + this.gridPos.y),new Vector(this.gridSize.x/10,this.gridSize.y/20),this.settings.colors.blocks.toHex(Math.max(this.board[y][x],0.2)))
                }else if(this.board[y][x] === 2){
                    this.Draw.rect(new Vector(x*this.gridSize.x/10 + this.gridPos.x, y*this.gridSize.y/20 + this.gridPos.y),new Vector(this.gridSize.x/10,this.gridSize.y/20),this.settings.colors.danger.toHex())
                }else{
                    this.Draw.rect(new Vector(x*this.gridSize.x/10 + this.gridPos.x, y*this.gridSize.y/20 + this.gridPos.y),new Vector(this.gridSize.x/10,this.gridSize.y/20),`rgba(55,55,55,${this.board[y][x]/10})`)
                }   
            }
        }
        for (let pos in this.activeTetromino.getPositions()){
            this.Draw.rect(new Vector(pos.x*this.gridSize.x/10 + this.gridPos.x, pos.y*this.gridSize.y/20 + this.gridPos.y),new Vector(this.gridSize.x/10,this.gridSize.y/20),this.settings.colors.danger.toHex())
        }
    }

    draw() {
        let ctx = this.program.getCtx('base')
        let ctx2 = this.program.getCtx('UI')
        this.Draw.useCtx(ctx)
        this.UIDraw.useCtx(ctx2)
        // Background
        
        this.drawUI()
        this.drawBackground()
        //this.Draw.rect(Vector.zero(),new Vector(1920,1080),'#000000')

        //for (let a = -1920/10; a<1920/10; a+=0.1){
        //    let result = peiceWise(a)
        //    let result2 = peiceWise(a-1)
        //    let scale = new Vector(10,10)
        //    if(result&&result2){
        //        this.Draw.line(new Vector(a*scale.x+1920/2,result2*scale.y+1080/2),new Vector(a*scale.x+1920/2,result*scale.y+1080/2),'#FF0000',1)
        //        this.Draw.circle(new Vector(a*scale.x+1920/2,result*scale.y+1080/2),0.5,'#FF0000')
        //    }
        //}


        if(this.scene==='title' || this.scene === 'bsod' || this.scene === 'modifiers'){
            return;
        }
        this.drawGrid()
        
        

        this.dragon.draw()
        for(let i = this.particles.length-1; i>0; i--){
            this.particles[i].draw();
        }
        // Sprites
        for(let block of [...this.blocks].reverse()){
            block.draw();
        }
        
        // Debug
        this.UIDraw.text(Math.round((1/this.delta)*100)/100,new Vector(0,20),"#FF0000")
        if(this.dragon.power<5){
            this.UIDraw.rect(new Vector(135,78),new Vector(this.dragon.health*5.08,34),'#FF0000')
            this.UIDraw.rect(new Vector(153,135),new Vector(this.dragon.anger*489,32),'rgba(62, 173, 31, 1)')
        }
        
        
        
    }
   
    drawBackground(){
        this.Draw.rect(new Vector(0,0),new Vector(1920,1080),'#000000ff')
        if(this.scene === 'title'){
            this.Draw.image(this.mainImages['title'],Vector.zero(),new Vector(1920,1080))
            return;
        }
        if(this.scene === 'bsod'){
            this.Draw.image(this.mainImages['bsod'],Vector.zero(),new Vector(1920,1080))
            return;
        }
        if(this.scene === 'modifiers'){
            this.Draw.image(this.mainImages['modifiers'],Vector.zero(),new Vector(1920,1080))
            return;
        }
        if(this.dragon.power > 5){
            this.Draw.image(this.desktopBG,Vector.zero(),new Vector(1920,1080))
        }else{
            this.Draw.image(this.mainImages['ui'],Vector.zero(),new Vector(1920,1080),1,0)
            if(this.timers['cooldown'][0]>0){
                if(this.modifiers[2]){
                    this.Draw.text(400-Math.round(this.timers['session'][0]*100)/100,new Vector(1920/2,1080/2),"#FFFFFF30",1,100,{'align':'center','baseline':'middle'})
                }else{
                    this.Draw.text(Math.round(this.timers['session'][0]*100)/100,new Vector(1920/2,1080/2),this.settings.colors.timer.toHex(),1,100,{'align':'center','baseline':'middle'})
                }
            }else{
                this.Draw.text(Math.round(this.timers['cooldown'][0]*100)/100,new Vector(1920/2,1080/2),this.settings.colors.timer.toHex(),1,100,{'align':'center','baseline':'middle'})
            }
        }  
        
    }

    drawUI(){
        // UI
        this.UIDraw.rect(Vector.zero(), new Vector(1920,1080), '000000FF',true, 0, true) // Clear
        if(this.scene ==='game'&&this.dragon.power<5){
            this.UIDraw.text(`Power: ${Math.round((this.dragon.power)*100)/100}`,new Vector(1470,140),"#FF0000",1,55,{'align':'center'})
            this.UIDraw.text(`Score: ${Math.round(this.aiScore)}`,new Vector(80,300),"#999999ff",1,55,{'align':'start'})
            this.UIDraw.text(`Deaths: ${Math.round(this.deaths)}`,new Vector(1280,290),"#960000ff",1,55,{'align':'start'})
            this.UIDraw.text(`Blocks: ${Math.round(this.sessionBlocks)}`,new Vector(1280,350),this.settings.colors.blocks.toHex(),1,55,{'align':'start'})
            this.UIDraw.text(`Resets: ${Math.round(this.resets)}`,new Vector(1280,410),"#FFFFFF55",1,55,{'align':'start'})
            this.UIDraw.text(`WASD or arrow keys to move.`,new Vector(1280,675),"#FFFFFF55",1,40,{'align':'start'})
            this.UIDraw.text(`Hold space to shoot fireballs.`,new Vector(1280,735),"#FFFFFF55",1,40,{'align':'start'})
            this.UIDraw.text(`Press g to use ability.`,new Vector(1280,795),"#FFFFFF55",1,40,{'align':'start'})
        }
        let sortedElements = [...this.elements].sort((a, b) => a.layer - b.layer);
        for (let elm of sortedElements){
            elm.draw(this.UIDraw);
        }
        if(this.scene === 'game' && this.dragon.power < 5){
            for(let l = 0; l<this.lineMessages.length; l++){
                this.UIDraw.text(this.lineMessages[l],new Vector(80,440+l*40),"#999999ff",1,35,{'align':'start'})
            }
        }
    }
    
    updateUI(delta){
        this.mouse.setMask(0);
        this.mouse.setPower(0);
        let sortedElements = [...this.elements].sort((a, b) => b.layer - a.layer);
        this.dragon.update(this.delta)
        for (let elm of sortedElements){
            elm.update(delta);
        }


    } 
}

// === Program ===
class Program {
    constructor(aspectRatio = 16 / 9) {
        // === Base DOM Refs ===
        this.layerContainer = getID("layers");
        this.uiContainer = getID("ui");

        // === Timing ===
        this.lastTime = 0;
        this.aspectRatio = aspectRatio;

        // === Input ===
        // Pass container rect (full-screen); we will set offset so mouse coords map to canvas.
        this.mouse = new Mouse(this.uiContainer.getBoundingClientRect());
        this.size = new Vector(window.innerWidth, window.innerHeight);
        this.keys = new Keys();

        // === Layers ===
        this.layers = new Map();    // main layers
        this.uiLayers = new Map();  // UI layers

        // === Draw Helpers ===
        this.Draw = new Draw(() => this.getCtx("main")); // default draw target
        this.UIDraw = new Draw(() => this.getCtx("ui")); // separate draw for UI

        // === Game/Application Logic ===
        this.game = new Game(this);

        this.attachEvents();
        this.loop(0);
    }

    // === Layers z-ordering ===
    updateZ() {
        let z = 0;
        this.layers.forEach(layer => {
            layer.canvas.style.zIndex = z++;
        });
        let uiZ = 100;
        this.uiLayers.forEach(layer => {
            layer.canvas.style.zIndex = uiZ++;
        });
    }

    addLayer(name, isUI = false) {
        if (this.layers.has(name) || this.uiLayers.has(name)) return null;

        const container = isUI ? this.uiContainer : this.layerContainer;
        const canvas = document.createElement("canvas");
        canvas.id = name;
        canvas.classList.add("layer");
        canvas.addEventListener("contextmenu", e => e.preventDefault());

        // Set initial pixel size to current program size (will be updated on resize)
        canvas.width = this.size.x;
        canvas.height = this.size.y;

        // Important: set pointer-events per-layer. UI layers should receive input.
        canvas.style.position = "absolute";
        canvas.style.pointerEvents = isUI ? "auto" : "none";

        container.appendChild(canvas);

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const layerData = { canvas, ctx, visible: true };
        if (isUI) {
            this.uiLayers.set(name, layerData);
        } else {
            this.layers.set(name, layerData);
        }
        this.updateZ();
        return ctx;
    }

    removeLayer(name) {
        const layer = this.layers.get(name) || this.uiLayers.get(name);
        if (!layer) return;
        if (layer.canvas.parentElement) {
            layer.canvas.parentElement.removeChild(layer.canvas);
        }
        this.layers.delete(name);
        this.uiLayers.delete(name);
        this.updateZ();
    }

    getCtx(name) {
        if (this.layers.has(name)) return this.layers.get(name).ctx;
        if (this.uiLayers.has(name)) return this.uiLayers.get(name).ctx;
        return null;
    }

    attachEvents() {
        this.resizeCanvas();

        // Prevent context menu inside #screen
        const screen = getID("screen");
        screen.addEventListener(
            "contextmenu",
            e => {
                e.preventDefault();
                e.stopPropagation();
            },
            { capture: true }
        );

        // Prevent mobile page scroll when touching the canvas area
        // (we also added passive:false so preventDefault works)
        [this.layerContainer, this.uiContainer].forEach(container => {
            container.addEventListener("touchmove", e => {
                // if you want certain UI elements to allow scrolling, guard here
                e.preventDefault();
            }, { passive: false });
        });

        // For any new canvases added dynamically
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === "CANVAS") {
                        node.addEventListener("contextmenu", e => e.preventDefault());
                        node.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
                    }
                });
            }
        });
        observer.observe(this.layerContainer, { childList: true });
        observer.observe(this.uiContainer, { childList: true });

        addEvent("window", null, "resize", () => this.resizeCanvas());
        addEvent("window", null, "orientationchange", () => this.resizeCanvas());
    }

    resizeCanvas() {
        const targetWidth = window.innerWidth;
        const targetHeight = window.innerHeight;

        // Lock aspect ratio
        let width = targetWidth;
        let height = Math.floor(width / this.aspectRatio);
        if (height > targetHeight) {
            height = targetHeight;
            width = Math.floor(height * this.aspectRatio);
        }

        // logical / pixel size of the game area
        this.size = new Vector(width, height);

        // keep whatever scaling system you had (mainWidth/mainheight globals)
        this.mouse.canvasScale.y = height / mainheight;
        this.mouse.canvasScale.x = width / mainWidth;
        this.Draw.Scale.y = height / mainheight;
        this.Draw.Scale.x = width / mainWidth;
        this.UIDraw.Scale.y = height / mainheight;
        this.UIDraw.Scale.x = width / mainWidth;

        // compute the top-left position (in CSS pixels) where the canvas will sit
        const canvasLeft = Math.round((targetWidth - width) / 2);
        const canvasTop = Math.round((targetHeight - height) / 2);

        // Resize and position every canvas (pixel size + CSS size + left/top)
        this.layers.forEach(layer => {
            layer.canvas.width = width;
            layer.canvas.height = height;
            layer.canvas.style.width = width + "px";   // CSS pixels -> ensures 1:1 mapping
            layer.canvas.style.height = height + "px";
            layer.canvas.style.left = canvasLeft + "px";
            layer.canvas.style.top = canvasTop + "px";
        });

        this.uiLayers.forEach(layer => {
            layer.canvas.width = width;
            layer.canvas.height = height;
            layer.canvas.style.width = width + "px";
            layer.canvas.style.height = height + "px";
            layer.canvas.style.left = canvasLeft + "px";
            layer.canvas.style.top = canvasTop + "px";
        });

        // Keep containers full-screen so they can catch events / be used for rect lookups
        if (this.uiContainer) {
            this.uiContainer.style.width = targetWidth + "px";
            this.uiContainer.style.height = targetHeight + "px";
        }
        if (this.layerContainer) {
            this.layerContainer.style.width = targetWidth + "px";
            this.layerContainer.style.height = targetHeight + "px";
        }

        // Mouse offset: we want mouse.pos to become (clientX - canvasLeft, clientY - canvasTop)
        // Mouse uses: (clientX - rect.left + offset.x) * scale
        // rect.left will be container left (usually 0), so set offset = -canvasLeft / -canvasTop
        this.mouse.setOffset(new Vector(-canvasLeft, -canvasTop));

        // Update the rect the mouse uses (container is full-screen — rect.left/top are usually 0)
        this.mouse.updateRect(this.uiContainer.getBoundingClientRect());
    }

    // === Main Loop ===
    loop(time) {
        let delta = (time - this.lastTime) / 1000;
        if (delta > 0.1) delta = 0.1;
        this.lastTime = time;

        debug.try();
        this.mouse.update(delta);
        this.keys.update(delta);
        this.update(delta);
        this.draw();
        debug.accept();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(delta) {
        this.game.update(delta);
    }

    draw() {
        this.game.draw(this.Draw, this.UIDraw);
    }
}

new Program();
