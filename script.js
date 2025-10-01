import Vector from './js/Vector.js';
import Color from './js/Color.js';
import Mouse from './js/Mouse.js';
import Keys from './js/Keys.js';
import Draw from './js/Draw.js';
import Saver from './js/Saver.js';
import { addEvent, getID } from './js/Support.js';


const mainWidth = 1920;
const mainheight = 1080;


class Game {
    constructor(program) {
        this.program = program; 

        this.mouse = program.mouse;
        this.keys = program.keys;
        this.Draw = program.Draw;  
        this.UIDraw = program.UIDraw; 

        // Engine state
        this.runtime = 0;
        this.delta = 0;
        this.program.addLayer('base', false);
        this.program.addLayer('UI', true);
        this.program.addLayer('overlays', true);
        this.program.updateZ();
        //Could you register a new ctx here in UIDraw:
        this.UIDraw.registerCtx('overlays',this.program.getCtx('overlays'));
        this.UIDraw.registerCtx('UI',this.program.getCtx('UI'));


        // Save data
        
        this.saver = new Saver("Save");
        
        this.elements = [];

        // Scenes
        this.scenes = new Map();
        this.currentScene = null;
        this.sceneName = null;
        this.init();
    }

    async init() {
        await this.loadScene('title');
        this.switchScene('title');
    }

    // Loads a scene from a file if not already loaded, or if reload is true. Returns a Promise
    async loadScene(name, resources, reload = false) {
        if (this.scenes.has(name) && !reload) return Promise.resolve(this.scenes.get(name));
        if (this.scenes.has(name) && reload) {
            this.removeScene(name);
        }
        // Dynamic import based on scene name
        return import(`./Scenes/${name}.js?update=${Date.now()}`).then(module => {
            const SceneClass = module[Object.keys(module)[0]];
            const scene = new SceneClass(
                this.Draw,
                this.UIDraw,
                this.mouse,
                this.keys,
                this.saver,
                this.switchScene.bind(this),
                this.loadScene.bind(this),
                this.preloadScene.bind(this),
                this.removeScene.bind(this),
            );
            if (scene.onPreload) return  scene.onPreload(resources).then(() => {
                this.scenes.set(name, scene);
                return scene;
            });
            this.scenes.set(name, scene);
            return scene;
        });
    }

    // Preloads a scene (calls onPreload if not already done)
    preloadScene(name, resources=null) {
        if (this.scenes.has(name)) return Promise.resolve();
        return this.loadScene(name, resources);
    }

    // Switches to a scene by name
    async switchScene(name) {
        await this.loadScene(name);
        if (!this.scenes.has(name)) {
            throw new Error(`Scene '${name}' not loaded. Call loadScene() first.`);
        }
        if (this.sceneName === name) return;
        let prevScene = this.currentScene;
        let prevResources = null;
        if (prevScene) {
            prevResources = prevScene.onSwitchTo();
        }
        let scene = this.scenes.get(name);
        if (scene.onSwitchFrom) {
            scene.onSwitchFrom(prevResources);
        }
        if (!scene.isReady && scene.onReady) {
            scene.onReady();
            scene.isReady = true;
        }
        this.currentScene = scene;
        this.sceneName = name;
    }

    // Removes a scene from the map
    removeScene(name) {
        if (this.scenes.has(name)) {
            if (this.sceneName === name) {
                this.currentScene = null;
                this.sceneName = null;
            }
            this.scenes.delete(name);
        }
    }

    update(delta) {
        this.runtime += delta;
        this.delta = delta;
        if (this.currentScene) {
            this.currentScene.update(delta);
        }
    }

    draw() {
        let ctx = this.program.getCtx('base');
        let ctx2 = this.program.getCtx('UI');
        this.Draw.useCtx(ctx);
        this.UIDraw.useCtx(ctx2);
        if (this.currentScene && this.currentScene.draw) {
            this.currentScene.draw();
        }
    }
}

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

        this.mouse.setOffset(new Vector(-canvasLeft, -canvasTop));
        this.mouse.updateRect(this.uiContainer.getBoundingClientRect());
    }

    // === Main Loop ===
    loop(time) {
        let delta = (time - this.lastTime) / 1000;
        if (delta > 0.1) delta = 0.1;
        this.lastTime = time;

        window.Debug.try();
        this.mouse.update(delta);
        this.keys.update(delta);
        this.update(delta);
        this.draw();
        window.Debug.accept();

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
