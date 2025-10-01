import Scene from './Scene.js';
import Vector from '../js/Vector.js';
import Color from '../js/Color.js';
import Board from '../Game logic/board.js';
import { Dragon,Appicon,FireBall,Fragment } from '../Game logic/sprites.js';
import Timer from '../js/Timer.js';

export class GameScene extends Scene {
    constructor(Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene) {
        super('game', Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene, removeScene);
        this.loaded = 0;
        this.elements = new Map()
    }
    
    async onPreload(resources=null) {

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
                default: console.warn(`Unknown resource key: ${key}`); log = false;
            }
            if (log) console.log(`Loaded: ${key}`);
        }
    }


    onReady() {
        this.isReady = true;
        this.createUI()
        this.AITimer = new Timer('loop', 0.1);
        this.AITimer.onLoop.connect(() => this.Board.updateAI());
        this.fallTimer = new Timer('loop', 0.2);
        this.sessionTimer = new Timer('stopwatch');
        this.fallTimer.onLoop.connect(() => this.Board.moveTetromino('fall'));
        this.AITimer.start();
        this.sessionTimer.start();
        this.fallTimer.start();
        this.frameCount = 0;

        // Session data
        this.deaths = 0;
        this.aiScore = 0;
        this.resets = 0;
        this.sessionBlocks = 0;
        this.lineMessages = [];

        this.dragon = new Dragon(this.mouse, this.keys, this.UIDraw, new Vector(1920/2,1080/2),this.SpriteImages)
        this.Board = new Board(this.Draw,this.dragon);
        this.Board.onPlace.connect(()=>this.soundGuy.play('place'))
        this.dragon.onDeath.connect(()=>{
            console.log("dragon died.");
            this.soundGuy.play('death');
            this.deaths+=1;
            this.dragon.reset(new Vector(1920/2,1080/2));
            this.Board.reset();
            this.lineMessages.push('HAHAHAHA!!!!!!!!!!!')
            
        })
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

    update(delta) {
        if(!this.isReady) return;
        this.AITimer.update(delta);
        this.fallTimer.update(delta);
        this.sessionTimer.update(delta);
        this.frameCount += 1;
        this.AITimer.endTime = 1/(10*Math.log10(Math.max(1,this.sessionTimer.getTime())**2))
        this.fallTimer.endTime = 1/(5*Math.log10(Math.max(1,this.sessionTimer.getTime())**2))
        if(this.keys.pressed('any') || this.mouse.pressed('any')){
            this.musician.resume()
        }
        if(this.loaded===4){
            this.loaded+=1
        }
        this.dragon.update(delta);
        this.Board.update(delta);
        this.mouse.setMask(0);
        this.mouse.setPower(0);
        let sortedElements = [...this.elements.values()].sort((a, b) => b.layer - a.layer);
        for (let elm of sortedElements){
            elm.update(delta);
        }
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
            this.Board.draw()
        }
        if(!((this.frameCount-21)%20)){
            this.UIDraw.rect(new Vector(0,0),new Vector(708,1080),null,true,0,true);
            this.UIDraw.image(this.BackgroundImages['ui2'],Vector.zero(),new Vector(708,1080))
            this.UIDraw.text(`Score: ${Math.round(this.aiScore)}`,new Vector(80,300),"#999999ff",1,55,{'align':'start'})
            if(this.lineMessages.length>15){
                this.lineMessages.shift();
            }
            
            for(let l = 0; l<this.lineMessages.length; l++){
                this.UIDraw.text(this.lineMessages[l],new Vector(80,440+l*40),"#999999ff",1,35,{'align':'start'})
            }
        }
        // Right UI
        if(!((this.frameCount-20)%20)){
            this.UIDraw.rect(new Vector(1223,0),new Vector(697,1080),null,true,0,true);
            this.UIDraw.image(this.BackgroundImages['ui1'],new Vector(1223,0),new Vector(697,1080))
            this.UIDraw.text(`Power: ${Math.round((this.dragon.power)*100)/100}`,new Vector(1470,140),"#FF0000",1,55,{'align':'center'})
            this.UIDraw.text(`Deaths: ${Math.round(this.deaths)}`,new Vector(1280,290),"#960000ff",1,55,{'align':'start'})
            this.UIDraw.text(`Blocks: ${Math.round(this.sessionBlocks)}`,new Vector(1280,350),this.settings.colors.blocks,1,55,{'align':'start'})
            this.UIDraw.text(`Resets: ${Math.round(this.resets)}`,new Vector(1280,410),"#FFFFFF55",1,55,{'align':'start'})
        }
        this.UIDraw.rect(new Vector(135,78),new Vector(100*5.18,34),'#000000')
        this.UIDraw.rect(new Vector(153,135),new Vector(1*499,32),'#000000')
        this.UIDraw.rect(new Vector(135,78),new Vector(this.dragon.health*5.18,34),'#FF0000')
        this.UIDraw.rect(new Vector(153,135),new Vector(this.dragon.anger*499,32),'rgba(62, 173, 31, 1)')
        let sortedElements = [...this.elements.values()].sort((a, b) => a.layer - b.layer);
        for (const elm of sortedElements) {
            elm.draw(this.UIDraw);
        }
        this.UIDraw.useCtx('overlays')
        this.UIDraw.clear()
        this.dragon.draw()
        this.UIDraw.useCtx('UI')

        

    }

    
}
