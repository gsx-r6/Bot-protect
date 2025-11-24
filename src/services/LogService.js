/**
 * LogService - Système centralisé de logging par canal
 * Chaque action est envoyée au canal approprié via des embeds formatés
 */

const { EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(process.cwd(), 'data', 'logs');
if (!fs.existsSync(LOGS_DIR)) {
    try { fs.mkdirSync(LOGS_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

class LogService {
    constructor(client) {
        this.client = client;
        this.logChannels = {
            moderation: process.env.LOG_CHANNEL_MODERATION || '',
            member: process.env.LOG_CHANNEL_MEMBER || '',
            message: process.env.LOG_CHANNEL_MESSAGE || '',
            voice: process.env.LOG_CHANNEL_VOICE || '',
            guild: process.env.LOG_CHANNEL_GUILD || '',
            security: process.env.LOG_CHANNEL_SECURITY || '',
            roles: process.env.LOG_CHANNEL_ROLES || '',
            channels: process.env.LOG_CHANNEL_CHANNELS || ''
        };
        this.channelsCache = new Map();
        this.isInitialized = false;
    }

    async getChannelFromCache(guild, channelId) {
        const cacheKey = `${guild.id}_${channelId}`;
        
        if (this.channelsCache.has(cacheKey)) {
            return this.channelsCache.get(cacheKey);
        }
        
        let channel = guild.channels.cache.get(channelId);
        
        if (!channel) {
            try {
                channel = await guild.channels.fetch(channelId);
            } catch (error) {
                return null;
            }
        }
        
        if (channel) {
            this.channelsCache.set(cacheKey, channel);
        }
        
        return channel;
    }

    /**
     * Envoyer un log de modération (ban, kick, mute, warn)
     */
    async logModeration(guild, action, details) {
        if (!this.logChannels.moderation) return;
        
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`🛡️ ${action}`)
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });

        if (details.user) {
            embed.addFields(
                { name: '👤 Utilisateur', value: `${details.user.tag} (${details.user.id})`, inline: true }
            );
        }

        if (details.moderator) {
            embed.addFields(
                { name: '👮 Modérateur', value: details.moderator.tag, inline: true }
            );
        }

        if (details.reason) {
            embed.addFields(
                { name: '📝 Raison', value: details.reason }
            );
        }

        if (details.duration) {
            embed.addFields(
                { name: '⏱️ Durée', value: details.duration, inline: true }
            );
        }

        if (details.extras) {
            Object.entries(details.extras).forEach(([key, value]) => {
                embed.addFields({ name: key, value: value.toString(), inline: true });
            });
        }

        return this.sendToChannel(guild, this.logChannels.moderation, embed);
    }

    /**
     * Envoyer un log membre (join/leave)
     */
    async logMember(guild, action, details) {
        if (!this.logChannels.member) return;

        const embed = new EmbedBuilder()
            .setColor(action === 'JOIN' ? '#00FF00' : '#FF0000')
            .setTitle(`${action === 'JOIN' ? '✅ Membre arrivé' : '❌ Membre parti'}`)
            .setThumbnail(details.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });

        embed.addFields(
            { name: '👤 Utilisateur', value: `${details.user.tag} (${details.user.id})` },
            { name: '📅 Compte créé', value: `<t:${Math.floor(details.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '⏰ Serveur rejoint', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        );

        if (details.memberCount) {
            embed.addFields(
                { name: '👥 Total membres', value: details.memberCount.toString(), inline: true }
            );
        }

        return this.sendToChannel(guild, this.logChannels.member, embed);
    }

    /**
     * Envoyer un log message (delete/edit)
     */
    async logMessage(guild, action, details) {
        if (!this.logChannels.message) return;

        const embed = new EmbedBuilder()
            .setColor(action === 'DELETE' ? '#FF0000' : '#FFA500')
            .setTitle(`${action === 'DELETE' ? '❌ Message supprimé' : '✏️ Message modifié'}`)
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });

        embed.addFields(
            { name: '👤 Auteur', value: `${details.author.tag} (${details.author.id})` },
            { name: '#️⃣ Canal', value: `<#${details.channel.id}>`, inline: true },
            { name: '🔗 Message ID', value: details.messageId || 'N/A', inline: true }
        );

        if (action === 'DELETE' && details.content) {
            const contentTrunc = details.content.length > 1024 ? details.content.substring(0, 1021) + '...' : details.content;
            embed.addFields(
                { name: '📄 Contenu supprimé', value: `\`\`\`${contentTrunc}\`\`\`` }
            );
        }

        if (action === 'EDIT' && details.before && details.after) {
            const beforeTrunc = details.before.length > 512 ? details.before.substring(0, 509) + '...' : details.before;
            const afterTrunc = details.after.length > 512 ? details.after.substring(0, 509) + '...' : details.after;
            embed.addFields(
                { name: '❌ Avant', value: `\`\`\`${beforeTrunc}\`\`\`` },
                { name: '✅ Après', value: `\`\`\`${afterTrunc}\`\`\`` }
            );
        }

        return this.sendToChannel(guild, this.logChannels.message, embed);
    }

    /**
     * Envoyer un log voix (join/leave canal)
     */
    async logVoice(guild, action, details) {
        if (!this.logChannels.voice) return;

        const embed = new EmbedBuilder()
            .setColor(action === 'JOIN' ? '#00FF00' : '#FF0000')
            .setTitle(`${action === 'JOIN' ? '🎤 Connecté à la voix' : '🔇 Déconnecté de la voix'}`)
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });

        embed.addFields(
            { name: '👤 Utilisateur', value: `${details.user.tag}`, inline: true },
            { name: '🎙️ Canal', value: details.channel.name, inline: true }
        );

        if (details.duration) {
            embed.addFields(
                { name: '⏱️ Durée', value: details.duration, inline: true }
            );
        }

        return this.sendToChannel(guild, this.logChannels.voice, embed);
    }

    /**
     * Envoyer un log serveur (config changes)
     */
    async logGuild(guild, action, details) {
        if (!this.logChannels.guild) return;

        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle(`⚙️ ${action}`)
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });

        if (details.moderator) {
            embed.addFields(
                { name: '👮 Modérateur', value: details.moderator.tag, inline: true }
            );
        }

        if (details.before) {
            embed.addFields(
                { name: '❌ Avant', value: details.before.toString() }
            );
        }

        if (details.after) {
            embed.addFields(
                { name: '✅ Après', value: details.after.toString() }
            );
        }

        if (details.extras) {
            Object.entries(details.extras).forEach(([key, value]) => {
                embed.addFields({ name: key, value: value.toString(), inline: true });
            });
        }

        return this.sendToChannel(guild, this.logChannels.guild, embed);
    }

    /**
     * Envoyer un log sécurité (detections, alerts)
     */
    async logSecurity(guild, action, details) {
        if (!this.logChannels.security) return;

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`🔒 ALERTE SÉCURITÉ - ${action}`)
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });

        if (details.user) {
            embed.addFields(
                { name: '👤 Utilisateur', value: `${details.user.tag} (${details.user.id})`, inline: true }
            );
        }

        if (details.severity) {
            embed.addFields(
                { name: '⚠️ Sévérité', value: details.severity, inline: true }
            );
        }

        if (details.description) {
            embed.addFields(
                { name: '📝 Description', value: details.description }
            );
        }

        if (details.extras) {
            Object.entries(details.extras).forEach(([key, value]) => {
                embed.addFields({ name: key, value: value.toString(), inline: true });
            });
        }

        return this.sendToChannel(guild, this.logChannels.security, embed);
    }

    /**
     * Envoyer un log rôles (assignation, suppression)
     */
    async logRoles(guild, action, details) {
        if (!this.logChannels.roles) return;

        const embed = new EmbedBuilder()
            .setColor('#9900FF')
            .setTitle(`${action === 'ADD' ? '✅ Rôle ajouté' : '❌ Rôle retiré'}`)
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });

        embed.addFields(
            { name: '👤 Utilisateur', value: `${details.user.tag}`, inline: true },
            { name: '🎭 Rôle', value: details.role.name, inline: true }
        );

        if (details.moderator) {
            embed.addFields(
                { name: '👮 Par', value: details.moderator.tag, inline: true }
            );
        }

        if (details.reason) {
            embed.addFields(
                { name: '📝 Raison', value: details.reason }
            );
        }

        return this.sendToChannel(guild, this.logChannels.roles, embed);
    }

    /**
     * Envoyer un log canaux (create/delete/edit)
     */
    async logChannels(guild, action, details) {
        if (!this.logChannels.channels) return;

        const embed = new EmbedBuilder()
            .setColor(action === 'CREATE' ? '#00FF00' : action === 'DELETE' ? '#FF0000' : '#FFA500')
            .setTitle(`${action === 'CREATE' ? '✅ Canal créé' : action === 'DELETE' ? '❌ Canal supprimé' : '✏️ Canal modifié'}`)
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });

        embed.addFields(
            { name: '#️⃣ Canal', value: details.channel.name, inline: true },
            { name: '📊 Type', value: details.channel.type.charAt(0).toUpperCase() + details.channel.type.slice(1), inline: true }
        );

        if (details.moderator) {
            embed.addFields(
                { name: '👮 Par', value: details.moderator.tag, inline: true }
            );
        }

        if (action === 'EDIT' && details.before && details.after) {
            embed.addFields(
                { name: '❌ Avant', value: details.before.toString() },
                { name: '✅ Après', value: details.after.toString() }
            );
        }

        return this.sendToChannel(guild, this.logChannels.channels, embed);
    }

    /**
     * Envoyer l'embed au canal spécifié
     */
    async sendToChannel(guild, channelId, embed) {
        if (!channelId) {
            await this.writeLocalLog(embed);
            return true;
        }

        try {
            const channel = await this.getChannelFromCache(guild, channelId);
            
            if (!channel || channel.type !== ChannelType.GuildText) {
                console.error(`❌ Canal de log invalide: ${channelId} — fallback fichier`);
                await this.writeLocalLog(embed);
                return false;
            }

            await channel.send({ embeds: [embed] });
            return true;
        } catch (error) {
            console.error(`❌ Erreur lors de l'envoi du log:`, error.message, '— fallback fichier');
            await this.writeLocalLog(embed);
            return false;
        }
    }

    async writeLocalLog(embed) {
        try {
            const data = this.formatEmbed(embed);
            const filePath = path.join(LOGS_DIR, `${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(filePath, data + '\n\n', { encoding: 'utf8' });
            return true;
        } catch (e) {
            console.error('❌ Impossible d\'écrire le log localement:', e.message);
            return false;
        }
    }

    formatEmbed(embed) {
        try {
            // embed peut être un EmbedBuilder -> toJSON() disponible
            const obj = typeof embed.toJSON === 'function' ? embed.toJSON() : (embed || {});
            const title = obj.title || '';
            const timestamp = obj.timestamp || new Date().toISOString();
            const fields = (obj.fields || []).map(f => `${f.name}: ${f.value}`).join('\n');
            const description = obj.description || '';
            return `[${timestamp}] ${title}\n${description}\n${fields}`;
        } catch (e) {
            return `[${new Date().toISOString()}] Log embed (non-serialisable)`;
        }
    }

    /**
     * Configurer les IDs des canaux de log
     */
    setLogChannels(channels) {
        this.logChannels = { ...this.logChannels, ...channels };
    }

    /**
     * Obtenir les informations de configuration
     */
    getLogChannels() {
        return this.logChannels;
    }
}

module.exports = LogService;
