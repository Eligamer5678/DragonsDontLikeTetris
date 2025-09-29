export class Keys { // Key input
    constructor() {
        this.keys = {};
        this.firstFrame = {};
        this.releasedFrame = {};

        window.addEventListener("keydown", e => {
            // prevent browser interfering with shortcuts
            if (e.key === " " || (e.altKey)) {
                e.preventDefault();
            }

            if (!this.keys[e.key]?.state) {
                this.keys[e.key] = { state: true, time: 0 };
                this.firstFrame[e.key] = true;
            }
        });

        window.addEventListener("keyup", e => {
            if ((e.altKey)) {
                e.preventDefault();
            }
            this.keys[e.key] = { state: false, time: 0 };
            this.firstFrame[e.key] = false;
            this.releasedFrame[e.key] = true; // mark released
        });
    }

    update(delta) {
        for (const k in this.keys) {
            const key = this.keys[k];
            key.time = key.state ? key.time + delta : 0;
        }
    }

    pressed(key) {
        if (this.firstFrame[key]) {
            this.firstFrame[key] = false;
            return true;
        }
        return false;
    }

    released(key) {
        if (this.releasedFrame[key]) {
            this.releasedFrame[key] = false;
            return true;
        }
        return false;
    }

    held(key, returnTime = false) {
        const k = this.keys[key];
        return (k && k.state) ? (returnTime ? k.time : true) : (returnTime ? 0 : false);
    }

    comboPressed(keysArray) {
        const all = keysArray.every(k => this.firstFrame[k]);
        if (all) keysArray.forEach(k => (this.firstFrame[k] = false));
        return all;
    }

    comboHeld(keysArray, returnTime = false) {
        if (!keysArray.every(k => this.keys[k]?.state)) return returnTime ? 0 : false;
        return returnTime ? Math.min(...keysArray.map(k => this.keys[k].time)) : true;
    }
}