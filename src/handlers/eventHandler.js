const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = async (client) => {
    const eventsPath = path.join(process.cwd(), 'src', 'events');
    if (!fs.existsSync(eventsPath)) return;
    const categories = fs.readdirSync(eventsPath);
    for (const cat of categories) {
        const dir = path.join(eventsPath, cat);
        if (!fs.statSync(dir).isDirectory()) continue;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            try {
                const ev = require(path.join(dir, file));
                if (!ev || !ev.name || !ev.execute) continue;
                const execute = async (...args) => {
                    try {
                        await ev.execute(...args, client);
                    } catch (error) {
                        logger.error(`❌ Erreur dans l'événement ${ev.name}:`, error);
                    }
                };

                if (ev.once) client.once(ev.name, execute);
                else client.on(ev.name, execute);
                logger.info(`Événement chargé : ${ev.name}`);
            } catch (e) {
                logger.error(`Échec du chargement de l'événement ${file}: ${e.message}`);
            }
        }
    }
};
