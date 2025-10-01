import Vector from "../js/Vector.js";

export const Tetrominos = {
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

export class Tetromino {
    constructor(type='',data){
        this.data = null
        if (type === 'random' || type === ''){
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