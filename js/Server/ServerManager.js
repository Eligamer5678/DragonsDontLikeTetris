import { ref, set, update, onValue, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import Signal from "../Signal.js";

export default class ServerManager {
    async clearAllRooms() {
        try {
            await set(ref(this.db, this.basePath), null);
            this.signals.sent.emit('clearAllRooms', null);
        } catch (e) {
            this.signals.error.emit(e);
        }
    }
    constructor(db, basePath = "rooms") {
        this.db = db;
        this.basePath = basePath;
        this.roomId = null;
        this.data = {};
        this.listeners = new Map();

        this.signals = {
            connected: new Signal(),
            disconnected: new Signal(),
            updated: new Signal(),
            error: new Signal(),
            sent: new Signal(),
            fetched: new Signal(),
        };
    }

    async createRoom() {
        this.roomId = Math.random().toString(36).substring(2, 8);
        this.playerId = "p1";
        await set(ref(this.db, `rooms/${this.roomId}`), {
            players: { p1: { connected: true }, p2: { connected: false } }
        });
        return this.roomId;
    }

    async joinRoom(roomId) {
        this.roomId = roomId;
        this.playerId = "p2";
        await update(ref(this.db, `rooms/${roomId}/players/p2`), { connected: true });
    }

    setRoom(roomId) {
        this.roomId = roomId;
    }

    _ensureRoom() {
        if (!this.roomId) {
            const err = new Error("ServerManager: No active room set");
            this.signals.error.emit(err);
            return false;
        }
        return true;
    }

    _path(path = "") {
        if (!this._ensureRoom()) throw new Error("ServerManager: No active room set");
        return `${this.basePath}/${this.roomId}/${path}`;
    }

    _getPathObj(path, createMissing = false) {
        const keys = path.split("/");
        let obj = this.data;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                if (createMissing) obj[keys[i]] = {};
                else return undefined;
            }
            obj = obj[keys[i]];
        }
        return { obj, lastKey: keys[keys.length - 1] };
    }

    get(path, defaultValue = null) {
        if (!this._ensureRoom()) return defaultValue;
        const res = this._getPathObj(path, false);
        if (!res) return defaultValue;
        const { obj, lastKey } = res;
        return obj.hasOwnProperty(lastKey) ? obj[lastKey] : defaultValue;
    }

    set(path, value, syncNow = true) {
        if (!this._ensureRoom()) return;
        const { obj, lastKey } = this._getPathObj(path, true);
        obj[lastKey] = value;
        if (syncNow) this.syncSet(path, value);
    }

    update(path, valueObj) {
        if (!this._ensureRoom()) return;
        const { obj, lastKey } = this._getPathObj(path, true);
        obj[lastKey] = { ...(obj[lastKey] || {}), ...valueObj };
        this.syncUpdate(path, valueObj);
    }

    remove(path, syncNow = true) {
        if (!this._ensureRoom()) return;
        const res = this._getPathObj(path, false);
        if (!res) return;
        const { obj, lastKey } = res;
        delete obj[lastKey];
        if (syncNow) this.syncRemove(path);
    }

    async syncSet(path, value) {
        if (!this._ensureRoom()) return;
        try {
            await set(ref(this.db, this._path(path)), value);
            this.signals.sent.emit(path, value);
        } catch (e) {
            this.signals.error.emit(e);
        }
    }

    async syncUpdate(path, valueObj) {
        if (!this._ensureRoom()) return;
        try {
            await update(ref(this.db, this._path(path)), valueObj);
            this.signals.sent.emit(path, valueObj);
        } catch (e) {
            this.signals.error.emit(e);
        }
    }

    async syncRemove(path) {
        if (!this._ensureRoom()) return;
        try {
            await set(ref(this.db, this._path(path)), null);
            this.signals.sent.emit(path, null);
        } catch (e) {
            this.signals.error.emit(e);
        }
    }

    async fetch(path = "") {
        if (!this._ensureRoom()) return null;
        try {
            const snapshot = await get(ref(this.db, this._path(path)));
            if (snapshot.exists()) {
                const val = snapshot.val();
                if (path) this.set(path, val, false);
                else this.data = val;
                this.signals.fetched.emit(path, val);
                return val;
            }
            return null;
        } catch (e) {
            this.signals.error.emit(e);
            return null;
        }
    }

    on(path, callback) {
        if (!this._ensureRoom()) return;
        const fullPath = this._path(path);
        const dbRef = ref(this.db, fullPath);
        const listener = onValue(dbRef, (snapshot) => {
            const val = snapshot.val();
            this.set(path, val, false);
            callback(val);
            this.signals.updated.emit(path, val);
        });
        this.listeners.set(fullPath, listener);
        this.signals.connected.emit(path);
    }

    off(path) {
        if (!this._ensureRoom()) return;
        const fullPath = this._path(path);
        const dbRef = ref(this.db, fullPath);
        off(dbRef);
        this.listeners.delete(fullPath);
        this.signals.disconnected.emit(path);
    }

    async sendDiff(diffObj) {
        if (!this._ensureRoom()) return;
        try {
            await update(ref(this.db, this._path("state")), diffObj);
            this.signals.sent.emit("state", diffObj);
        } catch (e) {
            this.signals.error.emit(e);
        }
    }
}

