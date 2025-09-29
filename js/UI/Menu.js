import { Geometry } from '../Geometry.js';

export class Menu{
    constructor(program,pos,size,layer,color){
        this.program = program;
        this.pos = pos;
        this.size = size;
        this.layer = layer;
        this.color = color;
        this.mouse = program.mouse;
        this.keys = program.keys;
        this.elements = new Map();
        this.visible = true;
    }
    update(delta){
        if (!this.visible) return;
        for (let [key,element] of this.elements){
            element.update(delta);
        }
        this.mouse.setPower(this.layer)
        if (Geometry.pointInRect(this.mouse.pos,this.pos,this.size)){
            if(this.layer > this.mouse.mask){
                this.mouse.setMask(this.layer);
            }
        }
    }
    draw(Draw){
        if (!this.visible) return;
        Draw.rect(this.pos,this.size,this.color);
        for (let [key,element] of this.elements){
            element.draw(Draw);
        }
        
    }
    addElement(key,element){
        element.addOffset(this.pos)
        this.elements.set(key,element)
    }

}