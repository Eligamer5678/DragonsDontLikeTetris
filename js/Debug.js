import { Vector } from './Vector.js';
import { getID } from './Support.js';
export class Debug {
    constructor(){
        this.logs = []
        this.element = getID('debug');
        this.ok = true;
    }
    try(){
        this.element.style.background = '#000000ff'
        this.ok = true;
    }
    catch(){
        this.element.style.background = '#6d0000ff'
        this.ok = false;
    }
    accept(){
        if(this.ok){
            this.element.style.background = '#004500ff'
        }
    }
    log(content) {
        // Push new content
        this.logs.push(content);

        // Keep only the last 10 entries
        if (this.logs.length > 10) {
            this.logs.shift();
        }

        // Build display text
        let full_content = '';
        let sigfigs = 0;
        const width = 12; // minimum line width

        for (let log of this.logs) {
            let display;

            if (log instanceof Vector) {
                // Format Vector objects as [x,y]
                display = `[${Math.round(log.x * (10 ** sigfigs)) / (10 ** sigfigs)}, ${Math.round(log.y * (10 ** sigfigs)) / (10 ** sigfigs)}]`;
            } else if (typeof log === 'string') {
                display = log;
            } else {
                display = String(log);
            }

            // Truncate if longer
            if (display.length > width) {
                display = display.slice(0, width);
            }


            full_content += display + '\n';
        }

        // Update the element
        this.element.textContent = full_content;
    }
}