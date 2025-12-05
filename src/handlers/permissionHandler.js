const { PermissionsBitField } = require('discord.js');

async function validatePermissions(executorMember, targetMember, botMember) {
    // Basic checks
    if (!executorMember || !targetMember) return { canModerate: false, reason: 'Membre introuvable' };
    // Owner checks
    if (executorMember.id === process.env.OWNER_ID) return { canModerate: true };
    if (targetMember.id === process.env.OWNER_ID) return { canModerate: false, reason: 'Impossible de sanctionner l\'owner du bot' };
    if (targetMember.id === targetMember.guild.ownerId) return { canModerate: false, reason: 'Impossible de sanctionner le propriétaire du serveur' };

    // Role hierarchy
    if (executorMember.roles.highest.position <= targetMember.roles.highest.position) return { canModerate: false, reason: 'La hiérarchie des rôles empêche cette action' };
    if (botMember.roles.highest.position <= targetMember.roles.highest.position) return { canModerate: false, reason: 'Le bot n\'a pas la permission de toucher ce membre' };

    return { canModerate: true };
}

module.exports = { validatePermissions };
