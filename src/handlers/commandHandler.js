const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = async (client) => {
    const commandsPath = path.join(process.cwd(), 'src', 'commands');
    const categories = fs.readdirSync(commandsPath);
    let loadedCount = 0;

    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));
        for (const file of files) {
            try {
                const cmd = require(path.join(categoryPath, file));
                if (!cmd || !cmd.name) continue;
                client.commands.set(cmd.name, cmd);
                if (cmd.aliases && Array.isArray(cmd.aliases)) cmd.aliases.forEach(a => client.aliases.set(a, cmd.name));
                logger.debug(`Commande chargée : ${cmd.name}`);
                loadedCount++;
            } catch (e) {
                logger.error(`Échec du chargement de la commande ${file}: ${e.message}`);
            }
        }
    }

    logger.info(`✅ ${loadedCount} commandes chargées avec succès`);
};
