export class Scene {
    constructor(name, Draw, UIDraw, mouse, keys, saver, switchScene, loadScene, preloadScene) {
        this.name = name;
        this.isReady = false;
        this.isPreloaded = false;
        this.resources = new Map(); // cached resources to keep when switching away
        this.Draw = Draw;
        this.UIDraw = UIDraw;
        this.Saver = saver;
        this.mouse = mouse;
        this.keys = keys;
        this.switchScene = switchScene;
        this.loadScene = loadScene;
        this.preloadScene = preloadScene;
    }

    /**
     * Called once, asynchronously, to preload assets (images, music, etc). 
     * Return a Promise.
     */
    async onPreload() {

    }

    /**
     * Called once when swapped to for the first time, to set up scene variables.
     */
    onReady() {

    }

    /**
     * Called every time this scene is switched to (after onReady).
     * Returns a Map of resources to keep cached (key: resource name, value: resource type).
     */
    onSwitchTo() {

    }

    /**
     * Called every time this scene is switched away from.
     */
    onSwitchFrom(resources) {

    }

    draw() {

    }
    update(delta) {

    }
}