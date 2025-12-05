const { GuildMember, PermissionsBitField } = require('discord.js');

function isId(id) {
    return /^\d{17,19}$/.test(id);
}

async function resolveMember(guild, input) {
    if (!guild) return null;
    if (!input) return null;
    // mention
    const mention = input.match(/^<@!?(\d+)>$/);
    if (mention) return guild.members.cache.get(mention[1]) || await guild.members.fetch(mention[1]).catch(()=>null);
    // id
    if (isId(input)) return guild.members.cache.get(input) || await guild.members.fetch(input).catch(()=>null);
    // username
    const byName = guild.members.cache.find(m => m.user.username.toLowerCase() === input.toLowerCase());
    return byName || null;
}

module.exports = { isId, resolveMember };
