export class Signal {
    constructor() {
        this.listeners = new Set();
    }

    connect(callback) {
    if (typeof callback === "function") {
        this.listeners.add(callback);
    } else {
        console.warn("Signal.connect expects a function.");
    }
    }

    disconnect(callback) {
        this.listeners.delete(callback);
    }

    emit(...args) {
    for (const callback of this.listeners) {
        try {
            callback(...args);
        } catch (e) {
            console.error("Signal callback error:", e);
        }
    }
    }

    clear() {
        this.listeners.clear();
    }
}