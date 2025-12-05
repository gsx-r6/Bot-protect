const { EmbedBuilder } = require("discord.js");

module.exports = {
  channelCreate: (client, channel) => {
    const embed = new EmbedBuilder()
      .setColor(client.config?.embedColor || "#FF69B4")
      .setAuthor({
        name: `${client.user.username} | Nouveau salon créé`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/emojis/1138482145673871400.webp?size=96&quality=lossless")
      .addFields(
        { name: `Nom`, value: `${channel.name}`, inline: true },
        { name: `ID`, value: `${channel.id}`, inline: true },
        { name: `Mention`, value: `<#${channel.id}>`, inline: true },
        { name: `NSFW`, value: `${channel.nsfw ? "Oui ✅" : "Non ❌"}`, inline: true },
        { name: `Catégorie`, value: `${channel.parent?.name || "Aucune"}`, inline: true },
        { name: `Créé`, value: `<t:${parseInt(channel.createdAt / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  channelDelete: (client, channel) => {
    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setAuthor({
        name: `${client.user.username} | Salon supprimé`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/emojis/1138482145673871400.webp?size=96&quality=lossless")
      .setDescription(`✅ Le salon **#${channel.name}** a été supprimé`)
      .addFields(
        { name: `Nom`, value: `${channel.name}`, inline: true },
        { name: `ID`, value: `${channel.id}`, inline: true },
        { name: `NSFW`, value: `${channel.nsfw ? "Oui ✅" : "Non ❌"}`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  channelPinsUpdate: (client, channel) => {
    const embed = new EmbedBuilder()
      .setColor(client.config?.embedColor || "#FF69B4")
      .setAuthor({
        name: `${client.user.username} | Message épinglé/désépinglé`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/emojis/1138483813694046339.webp?size=96&quality=lossless")
      .setDescription(`📌 Un message a été épinglé ou désépinglé`)
      .addFields(
        { name: `Salon`, value: `<#${channel.id}>`, inline: true },
        { name: `ID du salon`, value: `${channel.id}`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  channelUpdateName: (client, oldChannel, newChannel) => {
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `${client.user.username} | Nom du salon modifié`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/emojis/1138482145673871400.webp?size=96&quality=lossless")
      .setDescription([
        `### Informations du salon:`,
        `Nom: **${newChannel.name}**`,
        `Mention: <#${newChannel.id}>`,
        `ID: **${newChannel.id}**`,
      ].join("\n"))
      .addFields(
        { name: `Avant`, value: `${oldChannel.name}`, inline: true },
        { name: `Après`, value: `${newChannel.name}`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  channelUpdateNSFW: (client, oldChannel, newChannel) => {
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `${client.user.username} | Restriction d'âge modifiée`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setDescription([
        `### Informations du salon:`,
        `Nom: **${newChannel.name}**`,
        `Mention: <#${newChannel.id}>`,
        `ID: **${newChannel.id}**`,
      ].join("\n"))
      .addFields(
        { name: `Ancienne restriction`, value: `${oldChannel.nsfw ? "Activée ✅" : "Désactivée ❌"}`, inline: true },
        { name: `Nouvelle restriction`, value: `${newChannel.nsfw ? "Activée ✅" : "Désactivée ❌"}`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  channelUpdateTopic: (client, oldChannel, newChannel) => {
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `${client.user.username} | Description du salon modifiée`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/emojis/1138482145673871400.webp?size=96&quality=lossless")
      .setDescription([
        `### Informations du salon:`,
        `Nom: **${newChannel.name}**`,
        `Mention: <#${newChannel.id}>`,
        `ID: **${newChannel.id}**`,
      ].join("\n"))
      .addFields(
        { name: `Avant`, value: `${oldChannel.topic || "Aucune ❌"}`, inline: true },
        { name: `Après`, value: `${newChannel.topic || "Aucune ❌"}`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  channelUpdateSlowmode: (client, oldChannel, newChannel) => {
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `${client.user.username} | Mode lent modifié`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/emojis/785483969453883432.webp?size=96&quality=lossless")
      .setDescription([
        `### Informations du salon:`,
        `Nom: **${newChannel.name}**`,
        `Mention: <#${newChannel.id}>`,
        `ID: **${newChannel.id}**`,
      ].join("\n"))
      .addFields(
        { name: `Ancien slowmode`, value: `${oldChannel.rateLimitPerUser || 0}s`, inline: true },
        { name: `Nouveau slowmode`, value: `${newChannel.rateLimitPerUser || 0}s`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  emojiCreate: (client, emoji) => {
    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({
        name: `${client.user.username} | Nouvel emoji ajouté`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail(emoji.url)
      .addFields(
        { name: `Nom`, value: `${emoji.name}`, inline: true },
        { name: `ID`, value: `${emoji.id}`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  emojiDelete: (client, emoji) => {
    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setAuthor({
        name: `${client.user.username} | Emoji supprimé`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail(emoji.url)
      .addFields(
        { name: `Nom`, value: `${emoji.name}`, inline: true },
        { name: `ID`, value: `${emoji.id}`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  emojiUpdate: (client, oldEmoji, newEmoji) => {
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `${client.user.username} | Nom d'emoji modifié`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail(newEmoji.url)
      .addFields(
        { name: `Ancien nom`, value: `${oldEmoji.name}`, inline: true },
        { name: `Nouveau nom`, value: `${newEmoji.name}`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  guildBanAdd: (client, ban) => {
    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setAuthor({
        name: `${client.user.username} | Membre banni`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/emojis/1117871692803494023.webp?size=96&quality=lossless")
      .setDescription([
        `**${ban.user.username}** a été banni`,
        ``,
        `**Nom:** ${ban.user.username}`,
        `**ID:** ${ban.user.id}`,
      ].join("\n"))
      .setFooter({
        text: `Raison: ${ban.reason || "Aucune"}`,
        iconURL: ban.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setTimestamp();

    return embed;
  },

  guildBanRemove: (client, ban) => {
    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({
        name: `${client.user.username} | Membre débanni`,
        iconURL: client.user.displayAvatarURL({ size: 4096 }),
      })
      .setThumbnail(ban.user.displayAvatarURL({ dynamic: true, size: 4096 }))
      .setDescription([
        `**${ban.user.username}** a été débanni`,
        ``,
        `**Utilisateur:**`,
        `**Nom:** ${ban.user.username}`,
        `**ID:** ${ban.user.id}`,
      ].join("\n"))
      .setTimestamp();

    return embed;
  },

  guildMemberAdd: (client, member) => {
    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({
        name: `${member.user.username} a rejoint le serveur`,
        iconURL: member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
      .setDescription(`<@${member.user.id}> a rejoint le serveur`)
      .addFields(
        { name: `Nom`, value: `${member.user.username}`, inline: true },
        { name: `ID`, value: `${member.user.id}`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true },
        { name: `Compte créé`, value: `<t:${parseInt(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: `Membres total`, value: `${member.guild.memberCount}`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  guildMemberRemove: (client, member) => {
    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setAuthor({
        name: `${member.user.username} | A quitté le serveur`,
        iconURL: member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
      .setDescription(`**${member.user.username}** a quitté le serveur`)
      .addFields(
        { name: `Nom`, value: `${member.user.username}`, inline: true },
        { name: `ID`, value: `${member.user.id}`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true },
        { name: `Membres restants`, value: `${member.guild.memberCount}`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  messageDelete: (client, message) => {
    const content = message.content?.length > 1000 
      ? message.content.substring(0, 997) + "..." 
      : message.content || "Aucun contenu";

    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setAuthor({
        name: `Message supprimé`,
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail("https://cdn.discordapp.com/emojis/830790543659368448.webp?size=96&quality=lossless")
      .setDescription([
        `### Contenu du message`,
        `\`\`\`${content}\`\`\``
      ].join("\n"))
      .addFields(
        { name: `ID du message`, value: `${message.id}`, inline: true },
        { name: `Auteur`, value: `<@${message.author?.id}>`, inline: true },
        { name: `Données auteur`, value: `${message.author?.username || "Inconnu"}/${message.author?.id || "N/A"}`, inline: true },
        { name: `Salon`, value: `<#${message.channel.id}>`, inline: true },
        { name: `Timestamp`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  messageUpdateOld: (client, oldMessage) => {
    const content = oldMessage.content?.length > 1000 
      ? oldMessage.content.substring(0, 997) + "..." 
      : oldMessage.content || "Aucun contenu";

    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `Message modifié (1/2)`,
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1142475983396536451/1181689429723717682/pencil.png")
      .setDescription([
        `### Message original`,
        `\`\`\`${content}\`\`\``
      ].join("\n"))
      .setTimestamp();

    return embed;
  },

  messageUpdateNew: (client, oldMessage, newMessage) => {
    const content = newMessage.content?.length > 1000 
      ? newMessage.content.substring(0, 997) + "..." 
      : newMessage.content || "Aucun contenu";

    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `Message modifié (2/2)`,
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1142475983396536451/1181689429723717682/pencil.png")
      .setDescription([
        `### Message modifié`,
        `\`\`\`${content}\`\`\``
      ].join("\n"))
      .addFields(
        { name: `ID du message`, value: `${newMessage.id}`, inline: true },
        { name: `Auteur`, value: `<@${newMessage.author?.id}>`, inline: true },
        { name: `Données auteur`, value: `${newMessage.author?.username || "Inconnu"}/${newMessage.author?.id || "N/A"}`, inline: true },
        { name: `Salon`, value: `<#${newMessage.channel.id}>`, inline: true },
        { name: `Lien`, value: `[Aller au message](${newMessage.url})`, inline: true },
        { name: `Timestamp`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  voiceJoin: (client, newState) => {
    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({
        name: `${newState.member.user.username} | Rejoint le vocal`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> a **rejoint** le salon vocal <#${newState.channel.id}>`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  },

  voiceLeave: (client, oldState) => {
    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setAuthor({
        name: `${oldState.member.user.username} | Quitté le vocal`,
        iconURL: oldState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${oldState.member.user.id}> a **quitté** le salon vocal <#${oldState.channel.id}>`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  },

  voiceSwitch: (client, oldState, newState) => {
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `${newState.member.user.username} | Changé de salon vocal`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> a **changé** de salon vocal`)
      .addFields(
        { name: `De`, value: `<#${oldState.channel.id}>`, inline: true },
        { name: `Vers`, value: `<#${newState.channel.id}>`, inline: true },
        { name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return embed;
  },

  voiceMute: (client, newState) => {
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `${newState.member.user.username} | S'est rendu muet`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> s'est **rendu muet** dans <#${newState.channel.id}>`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  },

  voiceUnmute: (client, newState) => {
    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({
        name: `${newState.member.user.username} | S'est démute`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> s'est **démute** dans <#${newState.channel.id}>`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  },

  voiceDeaf: (client, newState) => {
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setAuthor({
        name: `${newState.member.user.username} | S'est rendu sourd`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> s'est **rendu sourd** dans <#${newState.channel.id}>`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  },

  voiceUndeaf: (client, newState) => {
    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({
        name: `${newState.member.user.username} | N'est plus sourd`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> n'est **plus sourd** dans <#${newState.channel.id}>`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  },

  voiceServerMute: (client, newState, muted) => {
    const embed = new EmbedBuilder()
      .setColor(muted ? "#FF0000" : "#00FF00")
      .setAuthor({
        name: `${newState.member.user.username} | ${muted ? "Mute serveur" : "Démute serveur"}`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> a été **${muted ? "mute" : "démute"}** par le serveur`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  },

  voiceServerDeaf: (client, newState, deafened) => {
    const embed = new EmbedBuilder()
      .setColor(deafened ? "#FF0000" : "#00FF00")
      .setAuthor({
        name: `${newState.member.user.username} | ${deafened ? "Sourd serveur" : "Plus sourd serveur"}`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> a été **${deafened ? "rendu sourd" : "plus sourd"}** par le serveur`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  },

  voiceStream: (client, newState, streaming) => {
    const embed = new EmbedBuilder()
      .setColor(streaming ? "#9146FF" : "#808080")
      .setAuthor({
        name: `${newState.member.user.username} | ${streaming ? "A démarré un stream" : "A arrêté son stream"}`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> ${streaming ? "a **démarré un stream**" : "a **arrêté son stream**"} dans <#${newState.channel.id}>`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  },

  voiceVideo: (client, newState, video) => {
    const embed = new EmbedBuilder()
      .setColor(video ? "#00FF00" : "#808080")
      .setAuthor({
        name: `${newState.member.user.username} | ${video ? "Caméra activée" : "Caméra désactivée"}`,
        iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 4096 }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1050740883319967764/1155814932999327814/1f50a.png")
      .setDescription(`<@${newState.member.user.id}> a **${video ? "activé" : "désactivé"} sa caméra** dans <#${newState.channel.id}>`)
      .addFields({ name: `Quand`, value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: true })
      .setTimestamp();

    return embed;
  }
};
