const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadCommands(dir, client) {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files = files.concat(loadCommands(fullPath, client));
        } else if (item.isFile() && item.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    return files;
}

module.exports = async (client) => {
    const commandsPath = path.join(process.cwd(), 'src', 'commands');

    try {
        if (!fs.existsSync(commandsPath)) {
            logger.warn(`Commands directory not found at ${commandsPath}`);
            return;
        }

        const commandFiles = loadCommands(commandsPath, client);
        let loadedCount = 0;

        for (const file of commandFiles) {
            try {
                const cmd = require(file);
                if (!cmd || !cmd.name) {
                    logger.warn(`Skipping invalid command file: ${path.relative(process.cwd(), file)}`);
                    continue;
                }

                client.commands.set(cmd.name, cmd);

                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                    cmd.aliases.forEach(a => client.aliases.set(a, cmd.name));
                }

                logger.debug(`Commande chargée : ${cmd.name}`);
                loadedCount++;
            } catch (e) {
                logger.error(`Échec du chargement de la commande ${path.relative(process.cwd(), file)}:`, e);
            }
        }

        logger.info(`✅ ${loadedCount} commandes chargées avec succès`);
    } catch (error) {
        logger.error('Critical error loading commands:', error);
    }
};
