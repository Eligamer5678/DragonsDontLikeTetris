export default class Signal {
    constructor() {
        // listeners: Map<name, callback>
        this.listeners = new Map();
    }

    /**
     * Connect a listener with a name. If only a callback is provided, uses callback.name or auto-generated name.
     * @param {string|function} nameOrCallback - Name or callback function.
     * @param {function} [callback] - Callback function if name is provided.
     */
    connect(nameOrCallback, callback) {
        if (typeof nameOrCallback === 'function' && callback === undefined) {
            // Only callback provided
            const cb = nameOrCallback;
            const name = cb.name || `listener_${this.listeners.size+1}`;
            this.listeners.set(name, cb);
        } else if (typeof nameOrCallback === 'string' && typeof callback === 'function') {
            this.listeners.set(nameOrCallback, callback);
        } else {
            console.warn('Signal.connect expects (name, function) or (function)');
        }
    }

    /**
     * Disconnect a listener by name.
     * @param {string} name - Name of the listener to remove.
     */
    disconnect(name) {
        if (typeof name === 'string') {
            this.listeners.delete(name);
        } else {
            console.warn('Signal.disconnect expects a name string');
        }
    }

    emit(...args) {
        for (const callback of this.listeners.values()) {
            try {
                callback(...args);
            } catch (e) {
                console.error('Signal callback error:', e);
            }
        }
    }

    clear() {
        this.listeners.clear();
    }
}