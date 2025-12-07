const { Events } = require('discord.js');
const JTCService = require('../../services/JTCService');
const logger = require('../../utils/logger');

// Event handler pour voiceStateUpdate
// Utilise le JTCService pour la logique
// Peut être étendu pour les logs vocaux plus tard

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,

    async execute(oldState, newState, client) {
        try {
            await JTCService.handleVoiceUpdate(oldState, newState);

            // TODO: Ajouter logs vocaux ici si besoin

        } catch (err) {
            logger.error('VoiceStateUpdate Error:', err);
        }
    }
};
