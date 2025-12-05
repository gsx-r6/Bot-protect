const path = require('path');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'reload',
    description: 'Recharger une commande (OWNER ONLY)',
    category: 'system',
    async execute(message, args, client) {
        try {
            if (message.author.id !== process.env.OWNER_ID) return message.reply({ embeds: [embeds.error('Owner only')] });
            const name = args[0];
            if (!name) return message.reply({ embeds: [embeds.error('Usage: reload <commande>')] });

            const cmd = client.commands.get(name) || client.commands.get(client.aliases.get(name));
            if (!cmd) return message.reply({ embeds: [embeds.error('Commande non trouvée')] });

            const cmdPath = require.resolve(path.join(process.cwd(), 'src', 'commands', cmd.category || '', `${cmd.name}.js`));
            delete require.cache[cmdPath];
            const fresh = require(cmdPath);
            client.commands.set(fresh.name, fresh);

            return message.reply({ embeds: [embeds.success(`Commande ${name} rechargée`)] });
        } catch (err) {
            client.logger.error('Reload error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du reload')] });
        }
    }
};
