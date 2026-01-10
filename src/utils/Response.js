const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

class Response {
    /**
     * Standard colors matching the bot's theme
     */
    static colors = {
        SUCCESS: '#2ECC71', // Green
        ERROR: '#E74C3C',   // Red
        WARNING: '#F1C40F', // Yellow
        INFO: config.EMBED_COLOR || '#3498DB', // Default Blue or Config Color
        PREMIUM: '#9B59B6'  // Purple
    };

    /**
     * Create a standardized success embed
     * @param {string} message 
     */
    static success(message) {
        return new EmbedBuilder()
            .setColor(this.colors.SUCCESS)
            .setDescription(`✅ **SUCCÈS**\n${message}`)
            .setFooter({ text: 'Nami Protect ⚡' })
            .setTimestamp();
    }

    /**
     * Create a standardized error embed
     * @param {string} message 
     */
    static error(message) {
        return new EmbedBuilder()
            .setColor(this.colors.ERROR)
            .setDescription(`❌ **ERREUR**\n${message}`)
            .setFooter({ text: 'Nami Protect ⚡' })
            .setTimestamp();
    }

    /**
     * Create a standardized info embed
     * @param {string} message 
     */
    static info(message) {
        return new EmbedBuilder()
            .setColor(this.colors.INFO)
            .setDescription(`ℹ️ **INFO**\n${message}`)
            .setFooter({ text: 'Nami Protect ⚡' })
            .setTimestamp();
    }

    /**
     * Create a standardized warning embed
     * @param {string} message 
     */
    static warning(message) {
        return new EmbedBuilder()
            .setColor(this.colors.WARNING)
            .setDescription(`⚠️ **ATTENTION**\n${message}`)
            .setFooter({ text: 'Nami Protect ⚡' })
            .setTimestamp();
    }

    /**
     * Create a premium rich embed
     * @param {string} title 
     * @param {string} description 
     * @param {Object[]} fields 
     */
    static premium(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setColor(this.colors.PREMIUM)
            .setTitle(`✨ ${title}`)
            .setDescription(description)
            .setFooter({ text: 'Nami Protect ⚡ • Premium' })
            .setTimestamp();

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    }
}

module.exports = Response;
