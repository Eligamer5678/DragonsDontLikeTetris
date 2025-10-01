import Signal from "../js/Signal.js";
import Vector from "../js/Vector.js";
import Geometry from "../js/Geometry.js";

export class Appicon {
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

export class Dragon {
    constructor(mouse,keys,draw,pos,images){
        this.pos = pos;
        this.keys = keys;
        this.mouse = mouse;
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
        this.onDeath = new Signal()
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
        if(this.health<=0){
            this.onDeath.emit()
            
        }
        
    }
    reset(pos=new Vector(1920/2,1080/2)){
        this.health = 100;
        this.power = 0.2;
        this.anger = 0;
        this.vlos = new Vector(0,0);
        this.pos = pos;
    }
    draw(){
        let rot = Math.sign(this.vlos.x) * Math.PI/4 * Math.pow(this.vlos.y,0.3)/2
        this.Draw.image(this.image,this.pos,this.size,new Vector(Math.sign(this.vlos.x*-1)),rot)
        for(let i = this.fireballs.length-1; i>0; i--){
            this.fireballs[i].draw();
        }
    }
}

export class FireBall {
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
        if(!Geometry.rectCollide(new Vector(730,0),new Vector(470,1080),this.pos,this.size) && this.power<5){
            this.adiós()
        }
    }
    draw(){
        this.Draw.image(this.image,this.pos.sub(this.size.mult(0.5)),this.size,0,this.rot)
    }
}

export class Fragment {
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
