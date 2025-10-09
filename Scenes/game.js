import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import Color from '../js/Color.js';
import Board from '../Game logic/board.js';
import { Dragon,Appicon,FireBall,Fragment } from '../Game logic/sprites.js';
import Timer from '../js/Timer.js';
import { Particle } from '../Game logic/Particle.js';
import { TitleScene } from './title.js';


export class GameScene extends Scene {
    constructor(Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene) {
        super('game', Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene);
        this.loaded = 0;
        this.elements = new Map()
        
    }
    async onPreload(resources=null) {

    }
    resetGame(){
        this.dragons.forEach((dragon)=>{
            dragon.died = false;
            dragon.reset(new Vector(1920/2,1080/2));
        })
        this.Board.reset();
        this.sessionTimer.reset();
        this.deaths = 0;
        this.aiScore = 0;
        this.lineMessages = [];
        this.resets = 0;
        this.sessionBlocks = 0;
    }
    connectDebug(){
        window.Debug.createSignal('setPower',(e)=>{this.dragons[0].power = e;});
        window.Debug.createSignal('setAnger',(e)=>{this.dragons[0].anger = e;});
        window.Debug.createSignal('killDragon',()=>{this.dragons[0].health = 0;});
        window.Debug.createSignal('fast',()=>{
            this.fallTimer.endTime = 0.01;
            this.AITimer.endTime = 0.01;
            if(this.SPEED === false){
                this.fallTimer.onLoop.connect('fall1', () => this.Board.moveTetromino('fall'));
                this.fallTimer.onLoop.connect('fall2', () => this.Board.moveTetromino('fall'));
                this.fallTimer.onLoop.connect('fall3', () => this.Board.moveTetromino('fall'));
                this.AITimer.onLoop.connect('ai1', () => this.Board.updateAI());
                this.AITimer.onLoop.connect('ai2', () => this.Board.updateAI());
                this.AITimer.onLoop.connect('ai3', () => this.Board.updateAI());
            }
            this.SPEED = true;
        });
        window.Debug.createSignal('slow',()=>{
            if(this.SPEED === true){
                this.fallTimer.onLoop.disconnect('fall1');
                this.fallTimer.onLoop.disconnect('fall2');
                this.fallTimer.onLoop.disconnect('fall3');
                this.AITimer.onLoop.disconnect('ai1');
                this.AITimer.onLoop.disconnect('ai2');
                this.AITimer.onLoop.disconnect('ai3');
            }
            this.SPEED = false;
        });
        window.Debug.createSignal('healthy',()=>{
            this.dragons.forEach((dragon) => {
                dragon.lockHp = !dragon.lockHp;
            })
        });
        window.Debug.createSignal('memory',()=>{
            let count = 0;
            function logMemory() {
                if (window.performance && window.performance.memory) {
                    const mem = window.performance.memory;
                    const usedMB = mem.usedJSHeapSize / 1048576;
                    const totalMB = mem.totalJSHeapSize / 1048576;
                    console.log(`Frame ${count+1}: Memory used: ${usedMB.toFixed(2)} MB / ${totalMB.toFixed(2)} MB`);
                } else {
                    console.log('performance.memory API not available in this browser.');
                }
                count++;
                if (count < 50) {
                    requestAnimationFrame(logMemory);
                }
            }
            logMemory();
        });
    }
    disconnectDebug(){
        window.Debug.disconnectSignal('setPower');
        window.Debug.disconnectSignal('killDragon');
        window.Debug.disconnectSignal('fast');
        window.Debug.disconnectSignal('slow');
        window.Debug.disconnectSignal('healthy');
    }
    onSwitchTo() {
        this.resetGame();
        this.disconnectDebug();
        this.Draw.clear()
        this.UIDraw.clear()
        return this.packResources(); 
    }
    packResources(){
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
        resources.set('dragons',this.dragons)
        return resources;
    }
    unpackResources(resources){
        if (!resources) {
            console.log('No resources...');
            return false;
        }

        if (!(resources instanceof Map)) {
            console.error('Invalid resources type');
            return false;
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
                case 'dragon': this.dragons = [value]; break;
                case 'settings-button': this.elements.set('settings-button', value); break;
                case 'pause': this.elements.set('pause', value); break;
                default: console.warn(`Unknown resource key: ${key}`); log = false;
            }
        }
        return true;
    }
    setConditions(){
        const conditions = [
            () => this.dragons[0].power > 1,
            () => this.dragons[0].power > 2,
            () => this.dragons[0].power > 3,
            () => this.dragons[0].power > 5,
        ];
        conditions.forEach((cond, i) => this.conductor.setCondition(i + 1, cond));
    }
    setMods(){
        this.dragons.forEach((dragon) => {
            if(this.saver.get('modifiers/modifier1', false)===true){
                dragon.fireballTimer = 10;
            }else{
                dragon.fireballTimer = 6;
            }
            if(this.saver.get('modifiers/modifier2', false)===true){
                dragon.big = true;
                console.log("big dragon enabled");
            }else{
                dragon.big = false;
            }
            if(this.saver.get('modifiers/modifier4', false)===true){
                dragon.heavy = true;
            }else{
                dragon.heavy = false;
            }
        })
        if(this.saver.get('modifiers/modifier6', false)===true){
            if (this.fallTimer && this.AITimer) {
                this.fallTimer.endTime = 0.01;
                this.AITimer.endTime = 0.01;
                if(this.SPEED === false){
                    this.fallTimer.onLoop.connect('fall1', () => this.Board.moveTetromino('fall'));
                    this.fallTimer.onLoop.connect('fall2', () => this.Board.moveTetromino('fall'));
                    this.fallTimer.onLoop.connect('fall3', () => this.Board.moveTetromino('fall'));
                    this.AITimer.onLoop.connect('ai1', () => this.Board.updateAI());
                    this.AITimer.onLoop.connect('ai2', () => this.Board.updateAI());
                    this.AITimer.onLoop.connect('ai3', () => this.Board.updateAI());
                }
                this.SPEED = true;
            }
        }else{
            if(this.SPEED === true && this.fallTimer && this.AITimer){
                this.fallTimer.onLoop.disconnect('fall1');
                this.fallTimer.onLoop.disconnect('fall2');
                this.fallTimer.onLoop.disconnect('fall3');
                this.AITimer.onLoop.disconnect('ai1');
                this.AITimer.onLoop.disconnect('ai2');
                this.AITimer.onLoop.disconnect('ai3');
            }
            this.SPEED = false;
        }
    }
    onSwitchFrom(resources) {
        if(!this.unpackResources(resources)) return false;
        

    }
    createParticles(){
        // Particle system: spawn particles over time
        this.particles = [];
        this.particleTimer = new Timer('loop', 0.05);
        this.particleTimer.onLoop.connect(() => {
            if (this.particles.length < 40) {
                let pos = new Vector(Math.random() * 1920, Math.random() * 1080);
                let vel = new Vector((Math.random()-0.5)*30, (Math.random()-0.5)*30);
                let size = 4 + Math.random() * 8;
                let color = new Color(Math.random(), Math.random(), Math.random(), 1);
                this.particles.push(new Particle(this.Draw, pos, vel, size, color));
            }
        });
        this.particleTimer.start();
    }
    createTimers(){
        this.AITimer = new Timer('loop', 0.1);
        this.AITimer.onLoop.connect(() => this.Board.updateAI());
        
        this.glitchTimer = new Timer('loop', 1);
        this.glitchTimer.onLoop.connect(() => this.Board.spawnGlitch());
        this.glitchTimer.start();
        
        this.fallTimer = new Timer('loop', 0.2);
        
        this.sessionTimer = new Timer('stopwatch');
        this.fallTimer.onLoop.connect(() => this.Board.moveTetromino('fall'));
        this.AITimer.start();
        this.sessionTimer.start();
        this.fallTimer.start();
    }
    createBoard(){
        this.Board = new Board(this.Draw,this.dragons);
        this.Board.onPlace.connect(()=>this.soundGuy.play('place'))
        this.Board.onLineclear.connect((lines)=>{
            this.soundGuy.play('lineclear');
            switch (lines) {
                case 1: 
                    this.aiScore += 40; 
                    this.lineMessages.push('Single. +40')
                    break;
                case 2: 
                    this.aiScore += 100; 
                    this.lineMessages.push('Double. +100')
                    break;
                case 3: 
                    this.aiScore += 300; 
                    this.lineMessages.push('Triple! +300')
                    break;
                case 4: 
                    this.aiScore += 1200; 
                    this.lineMessages.push('TETRIS!! +1200')
                    this.narrator.playSequence(['tetris'],this.settings.volume.narrator)
                    this.narratorCooldown = 1;
                    break;
                default: break;
            }
        })
        this.Board.onTopout.connect(()=>{
            this.soundGuy.play('reset')
            this.resets+=1
            this.lineMessages.push('Stack overflow. Restarting...')
        })
        this.Board.onRotate.connect(()=>this.soundGuy.play('rotate'))
        this.Board.blockBroken.connect(()=>{this.soundGuy.play('break');this.sessionBlocks+=1;})
        this.Board.blockDamaged.connect(()=>this.soundGuy.play('fireball'))
    }
    onReady() {
        this.isReady = true;
        
        this.createUI()
        this.createTimers()
        this.frameCount = 0;
        
        this.soundsPlayed = 0;
        this.createParticles()
        

        // Session data
        this.deaths = 0;
        this.aiScore = 0;
        this.resets = 0;
        this.sessionBlocks = 0;
        this.lineMessages = [];
        if(this.saver.get('twoPlayer',true)){
            this.playerCount = 2;
        }else{
            this.playerCount = 1;
        }

        if(this.playerCount === 1){
            this.dragons = [new Dragon(this.mouse, this.keys, this.UIDraw, new Vector(1920/2,1080/2),this.SpriteImages,'')]
        }
        if(this.playerCount === 2){
            this.dragons = [
                new Dragon(this.mouse, this.keys, this.UIDraw, new Vector(1920/2-100,1080/2),this.SpriteImages,'wasd'),
                new Dragon(this.mouse, this.keys, this.UIDraw, new Vector(1920/2+100,1080/2),this.SpriteImages,'arrows'),
            ]
            this.dragons[0].which = 0;
            this.dragons[1].which = 1;
            this.dragons[0].twoPlayer = true;
            this.dragons[1].twoPlayer = true;
            this.dragons[1].image = this.SpriteImages['blue-dragon'];
        }
        this.createBoard()
        this.dragonsLeft = this.playerCount;
        this.reviveDragons = false;
        this.dragons.forEach((dragon) => {
            if(this.saver.get('twoPlayer')){
                dragon.health = 50;
            }
            dragon.onDeath.connect(()=>{
                this.dragonsLeft -= 1; 
            })
            if(this.dragonsLeft<=0) {
                console.log("all dragons died.");
                this.soundGuy.play('death');
                this.deaths+=1;
                dragon.reset(new Vector(1920/2,1080/2));
                this.Board.reset();
                this.lineMessages.push('HAHAHAHA!!!!!!!!!!!')
                this.sessionTimer.reset();
                this.aiScore = 0;
                this.sessionBlocks = 0;
            }
            dragon.megaabilty.connect(()=>{
                this.reviveDragons = true;
            })
        })
        
        this.connectDebug()
        this.setConditions()
        this.setMods()
    }
    narratorSounds(){
        // List of narrator sound actions in order, each returns true if played
        const soundActions = [
            () => { if(this.sessionBlocks>25) { this.narrator.play('Stop destroying the blocks 1',this.saver.get('settings/volume/narrator',1)); return true; } return false; },
            () => { if(this.sessionBlocks>50) { this.narrator.play('Stop destroying the blocks 2',this.saver.get('settings/volume/narrator',1)); return true; } return false; },
            () => { if(this.sessionBlocks>75) { this.narrator.play('Stop destroying the blocks 3',this.saver.get('settings/volume/narrator',1)); return true; } return false; },
            () => { if(this.dragons[0].power>=0.5) { this.narrator.playSequence(['bigger fireballs 2','thats great 3'],this.saver.get('settings/volume/narrator',1)); return true; } return false; },
            () => { if(this.dragons[0].power>=1) { this.narrator.playSequence(['Are you getting stronger'],this.saver.get('settings/volume/narrator',1)); return true; } return false; },
            () => { if(this.dragons[0].power>=4) { this.narrator.playSequence(['dragon left'],this.saver.get('settings/volume/narrator',1)); return true; } return false; },
            () => { if(this.dragons[0].power>=5) { this.narrator.playSequence(['dont crash my pc'],this.saver.get('settings/volume/narrator',1)); return true; } return false; },
            () => { if(this.sessionBlocks>150) { this.narrator.playSequence(['Stop destroying the blocks 2','success'],this.saver.get('settings/volume/narrator',1)); return true; } return false; }
        ];
        // Only play the next sound if it hasn't been played yet
        if (this.soundsPlayed < soundActions.length) {
            if (soundActions[this.soundsPlayed]()) {
                this.soundsPlayed++;
            }
        }
    }
    updateTimers(delta){
        this.AITimer.update(delta);
        this.fallTimer.update(delta);
        this.sessionTimer.update(delta);
        this.particleTimer.update(delta);
        this.glitchTimer.update(delta);
        if(this.saver.get('modifiers/modifier3', false)){
            this.sessionTimer.update(delta);
            this.sessionTimer.update(delta);
        }
        if(this.sessionTimer.getTime()>300){
            this.glitchTimer.endTime = 1/((this.sessionTimer.getTime()-299)/15)
        }
        else if(this.saver.get('twoPlayer',false) && this.sessionTimer.getTime()>200){
            this.glitchTimer.endTime = 1/((this.sessionTimer.getTime()-200)/15)
        }
        else{
            this.glitchTimer.time = 0;
        }
        if(!this.SPEED){
            this.AITimer.endTime = 1/(10*Math.log10(Math.max(1,this.sessionTimer.getTime())**2))
            this.fallTimer.endTime = 1/(5*Math.log10(Math.max(1,this.sessionTimer.getTime())**2))
        }
        if(this.sessionTimer.getTime()>100){
            this.AITimer.endTime = 0.009
            this.fallTimer.endTime = 0.018
        }
    }
    updateParticles(delta){
        // Update particles
        for (let p of this.particles) p.update(delta);
        // Remove dead particles and respawn
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].isAlive()) {
                // Respawn at random position
                let pos = new Vector(Math.random() * 1920, Math.random() * 1080);
                let vel = new Vector((Math.random()-0.5)*30, (Math.random()-0.5)*30);
                let size = 4 + Math.random() * 8;
                let color = new Color(Math.random(), Math.random(), Math.random(), 1);
                this.particles[i] = new Particle(this.Draw, pos, vel, size, color);
            }
        }
    }
    update(delta) {
        if(!this.isReady) return;
        this.frameCount += 1;
        this.updateTimers(delta)
        this.narratorSounds();
        if(this.saver.get('modifiers/modifier5', false)){
            this.dragons.forEach((dragon) => {
                dragon.health += dragon.power*delta/10;
                if(dragon.health > dragon.power*10){
                    dragon.health = dragon.power*10
                }
            })
        }
        if(this.reviveDragons){
            this.dragons.forEach((dragon) => {
                console.log('ability activated')
                if(dragon.died){
                    dragon.died = false;
                    dragon.reset(new Vector(1920/2,1080/2));
                }   
            })
            this.reviveDragons = false;
        }
        if(this.keys.pressed('any') || this.mouse.pressed('any')){
            this.musician.resume()
        }
        if(this.loaded===4){
            this.loaded+=1
        }
        this.dragons.forEach((dragon) => {
            dragon.update(delta);
        })
        this.Board.update(delta);
        this.mouse.setMask(0);
        this.mouse.setPower(0);
        let sortedElements = [...this.elements.values()].sort((a, b) => b.layer - a.layer);
        for (let elm of sortedElements){
            elm.update(delta);
        }
        let swap = true;
        this.dragons.forEach((dragon) => {
            if(dragon.power<5){
                swap = false;
            }
        })
        if(swap){
            this.switchScene('desktop')
        }
        let allDead = true;
        this.dragons.forEach((dragon) => {
            if(dragon.died===false){
                allDead = false;
            }
        
        })
        if(allDead) this.resetGame()
        this.updateParticles(delta)
        
        this.Board.dmgMult = 1 + this.aiScore/10000;

        let maxPower = 0;
        let maxAnger = 0;
        this.dragons.forEach((dragon) => {
            if(dragon.power > maxPower) maxPower = dragon.power;
            if(dragon.anger > maxAnger) maxAnger = dragon.anger;
        })
        this.dragons.forEach((dragon) => {
            dragon.power = maxPower;
            dragon.anger = maxAnger;
        })
    }
    createUI(){
        
    }
    draw() {
        if(!this.isReady) return;
        // Left UI
        if(!((this.frameCount)%2)){
            this.UIDraw.rect(new Vector(700,0),new Vector(530,1080),null,true,0,true);
            this.Draw.image(this.BackgroundImages['background'],Vector.zero(),new Vector(1920,1080))
            this.Draw.text(Math.round(this.sessionTimer.getTime()*100)/100,new Vector(1920/2,1080/2),this.settings.colors.timer,1,100,{'align':'center','baseline':'middle'})
            // Draw particles
            for (let p of this.particles) p.draw();
            this.Board.draw()
        }
        if(this.lineMessages.length>15){
            this.lineMessages.shift();
        }
        if(!((this.frameCount-21)%20)){
            this.UIDraw.rect(new Vector(0,0),new Vector(708,1080),null,true,0,true);
            if(this.dragons.length<2){
                this.UIDraw.image(this.BackgroundImages['ui2'],Vector.zero(),new Vector(708,1080))
            }else{
                this.UIDraw.image(this.BackgroundImages['coop-ui2'],Vector.zero(),new Vector(708,1080))
            }
            this.UIDraw.text(`Score: ${Math.round(this.aiScore)}`,new Vector(80,300),"#999999ff",1,55,{'align':'start'})
            this.UIDraw.text(`Increasing damage taken by: ${Math.round(this.aiScore/100)}%`,new Vector(120,330),"#791a1aff",1,25,{'align':'start','italics' :true})
            
            
            for(let l = 0; l<this.lineMessages.length; l++){
                this.UIDraw.text(this.lineMessages[l],new Vector(80,440+l*40),"#999999ff",1,35,{'align':'start'})
            }
        }
        // Right UI
        if(!((this.frameCount-20)%20)){
            this.UIDraw.rect(new Vector(1223,0),new Vector(697,1080),null,true,0,true);
            if(this.dragons.length<2){
                this.UIDraw.image(this.BackgroundImages['ui1'],new Vector(1223,0),new Vector(697,1080))
            }else{
                this.UIDraw.image(this.BackgroundImages['coop-ui1'],new Vector(1233,0),new Vector(697,1080))
            }
            this.UIDraw.rect(new Vector(1261,62),new Vector((this.dragons[0].power % 1)*436,117),'#ff000033')
            if((this.dragons[0].power % 1)*436 > 4.5){
                this.UIDraw.rect(new Vector(1265,179),new Vector(Math.min((this.dragons[0].power % 1)*436-4.5,427),6),'#ff000033') //diff 9
                this.UIDraw.rect(new Vector(1265,56),new Vector(Math.min((this.dragons[0].power % 1)*436-4.5,427),6),'#ff000033')
            }

            this.UIDraw.text(`Power: ${Math.round((this.dragons[0].power)*100)/100}`,new Vector(1470,140),"#FF0000",1,55,{'align':'center'})
            this.UIDraw.text(`Deaths: ${Math.round(this.deaths)}`,new Vector(1290,290),"#ff0000ff",1,45,{'align':'start'})
            this.UIDraw.text(`Blocks: ${Math.round(this.sessionBlocks)}`,new Vector(1290,340),this.settings.colors.blocks,1,45,{'align':'start'})
            this.UIDraw.text(`Board resets: ${Math.round(this.resets)}`,new Vector(1290,390),"#FFFFFF55",1,45,{'align':'start'})
        }
        if(this.dragons.length!==2){
            this.UIDraw.rect(new Vector(135,78),new Vector(100*5.18,34),'#000000')
            this.UIDraw.rect(new Vector(153,135),new Vector(1*499,32),'#000000')
            this.UIDraw.rect(new Vector(135,78),new Vector(this.dragons[0].health*5.18,34),'#FF0000')
            this.UIDraw.rect(new Vector(153,135),new Vector(Math.min(this.dragons[0].anger,1)*499,32),'rgba(62, 173, 31, 1)')
        }
        if(this.dragons.length===2){
            this.UIDraw.rect(new Vector(125,80),new Vector(100*2.15,32),'#000000')
            this.UIDraw.rect(new Vector(125,80),new Vector(this.dragons[0].health*2.15*2,32),'#FF0000')
            
            this.UIDraw.rect(new Vector(605,80),new Vector(-100*2.1,32),'#000000')
            this.UIDraw.rect(new Vector(605,80),new Vector(-this.dragons[1].health*2.1*2,32),'#005effff')

            this.UIDraw.rect(new Vector(73,135),new Vector(1*580,32),'#000000')
            this.UIDraw.rect(new Vector(73,135),new Vector(Math.min(this.dragons[0].anger,1)*580,32),'rgba(148, 28, 138, 1)')
        }
        this.UIDraw.useCtx('overlays')
        this.UIDraw.clear()
        let sortedElements = [...this.elements.values()].sort((a, b) => a.layer - b.layer);
        for (const elm of sortedElements) {
            elm.draw(this.UIDraw);
        }
        this.dragons.forEach((dragon) => {
            dragon.draw();
        })
        this.UIDraw.useCtx('UI')

        

    }
} 