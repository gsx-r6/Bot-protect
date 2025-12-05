const { Client, GatewayIntentBits, Collection } = require('discord.js');
const path = require('path');
const commandHandler = require('../handlers/commandHandler');
const eventHandler = require('../handlers/eventHandler');
const logger = require('../utils/logger');
const LogService = require('../services/LogService');

class HarukaClient extends Client {
    constructor() {
        // Include presence and voice-state intents so we can report online & voice counts
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildVoiceStates
            ]
        });
        this.commands = new Collection();
        this.aliases = new Collection();
        this.cooldowns = new Collection();
        this.logger = logger;
        this.logs = null; // Sera initialisé au ready

        // Attach runtime config
        try {
            this.config = require('../config/config');
        } catch (e) {
            this.config = {};
        }
    }

    async start() {
        // Load handlers
        await commandHandler(this);
        await eventHandler(this);

        // Login
        if (!process.env.TOKEN) {
            logger.error('Aucun TOKEN trouvé dans l\'environnement. Annulation du démarrage.');
            throw new Error('TOKEN non défini');
        }

        await this.login(process.env.TOKEN);
        // start background jobs (non-blocking)
        try {
            const statsJob = require('../jobs/statsVoiceUpdater');
            statsJob.start(this);
        } catch (e) {
            logger.warn('Pas de statsVoiceUpdater ou échec du démarrage : ' + (e.message || e));
        }
        logger.info('HarukaClient démarré');
    }
}

module.exports = HarukaClient;
