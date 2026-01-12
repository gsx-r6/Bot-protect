const { Client, GatewayIntentBits, Collection } = require('discord.js');
const path = require('path');
const commandHandler = require('../handlers/commandHandler');
const eventHandler = require('../handlers/eventHandler');
const logger = require('../utils/logger');
const LogService = require('../services/LogService');
const AdvancedAntiRaid = require('../security/advancedAntiRaid');
const LeakerTrap = require('../security/leakerTrap');
const FloodProtector = require('../security/floodProtector');
const MuteService = require('../services/MuteService');
const AntiBot = require('../security/antiBot');
const RoleProtector = require('../security/roleProtector');
const MemberProtector = require('../security/memberProtector');

class NamiClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildModeration
            ]
        });
        this.commands = new Collection();
        this.aliases = new Collection();
        this.cooldowns = new Collection();
        this.logger = logger;
        this.logs = new LogService(this);
        this.antiRaid = new AdvancedAntiRaid(this);
        this.antiRaid.init();
        this.leakerTrap = new LeakerTrap(this);
        this.leakerTrap.init();
        this.floodProtector = new FloodProtector(this);
        this.floodProtector.init();
        this.muteService = new MuteService(this);
        this.muteService.init();
        this.antiBot = new AntiBot(this);
        this.antiBot.init();
        this.roleProtector = new RoleProtector(this);
        this.roleProtector.init();
        this.memberProtector = new MemberProtector(this);
        this.memberProtector.init();

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

            // Initialisation des backups automatiques
            const BackupService = require('../services/BackupService');
            BackupService.initAutoBackup(this);
        } catch (e) {
            logger.warn('Échec du démarrage des jobs de fond : ' + (e.message || e));
        }
        logger.info('NamiClient démarré avec succès');
    }
}

module.exports = NamiClient;
