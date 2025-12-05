const logger = require('../utils/logger');

class CooldownHandler {
    constructor() {
        this.map = new Map();
    }

    isOnCooldown(userId, commandName) {
        const key = `${userId}:${commandName}`;
        const entry = this.map.get(key);
        if (!entry) return false;
        if (Date.now() > entry) { this.map.delete(key); return false; }
        return Math.ceil((entry - Date.now()) / 1000);
    }

    setCooldown(userId, commandName, seconds) {
        const key = `${userId}:${commandName}`;
        this.map.set(key, Date.now() + seconds * 1000);
    }
}

module.exports = new CooldownHandler();
