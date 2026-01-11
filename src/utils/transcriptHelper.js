const { AttachmentBuilder } = require('discord.js');

module.exports = {
    /**
     * Génère un transcript HTML stylé Discord
     * @param {TextChannel} channel 
     * @param {Collection<string, Message>} messages 
     * @param {Guild} guild 
     * @returns {AttachmentBuilder}
     */
    async generateHTMLTranscript(channel, messages, guild) {
        const escapeHTML = (str) => {
            if (!str) return '';
            return str.replace(/[&<>"']/g, (m) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m]));
        };

        const sortedMessages = [...messages.values()].reverse();
        const escapedChannelName = escapeHTML(channel.name);
        const escapedGuildName = escapeHTML(guild.name);

        let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transcript - ${escapedChannelName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        body {
            background-color: #36393f;
            color: #dcddde;
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
        }
        .header {
            background-color: #2f3136;
            padding: 20px;
            box-shadow: 0 1px 0 rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .header h1 { margin: 0; font-size: 20px; color: #fff; }
        .header .meta { font-size: 12px; color: #72767d; }
        .messages { padding: 20px; }
        .message {
            display: flex;
            margin-bottom: 20px;
            padding: 5px 0;
        }
        .message:hover { background-color: rgba(4, 4, 5, 0.07); }
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .content { width: 100%; }
        .username {
            font-weight: 500;
            color: #fff;
            margin-right: 5px;
        }
        .timestamp {
            font-size: 12px;
            color: #72767d;
        }
        .text {
            margin-top: 5px;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.375rem;
        }
        .attachment {
            margin-top: 10px;
            max-width: 400px;
            border-radius: 4px;
        }
        .embed {
            background-color: #2f3136;
            border-left: 4px solid #202225;
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
            max-width: 500px;
        }
        .embed-title { font-weight: bold; margin-bottom: 5px; color: #fff; }
        .embed-desc { font-size: 14px; color: #dcddde; }
        .embed-field { margin-top: 5px; }
        .field-name { font-weight: bold; font-size: 13px; color: #fff; }
        .field-value { font-size: 13px; color: #dcddde; }
        .code {
            background-color: #2f3136;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>#${escapedChannelName}</h1>
            <div class="meta">${escapedGuildName} • ${sortedMessages.length} messages</div>
        </div>
        <div class="meta">Généré le ${new Date().toLocaleString('fr-FR')}</div>
    </div>
    <div class="messages">
`;

        for (const msg of sortedMessages) {
            const avatarUrl = msg.author.displayAvatarURL({ extension: 'png', size: 64 });
            const username = escapeHTML(msg.author.username);
            const date = msg.createdAt.toLocaleString('fr-FR');
            const content = msg.content
                ? escapeHTML(msg.content).replace(/\n/g, '<br>')
                : '';

            html += `
        <div class="message">
            <img src="${avatarUrl}" class="avatar" alt="avatar">
            <div class="content">
                <div>
                    <span class="username">${username}</span>
                    <span class="timestamp">${date}</span>
                </div>
                <div class="text">${content}</div>
`;

            // Images / Attachments
            if (msg.attachments.size > 0) {
                msg.attachments.forEach(att => {
                    const isImage = att.contentType?.startsWith('image/');
                    if (isImage) {
                        html += `<a href="${att.url}" target="_blank"><img src="${att.url}" class="attachment"></a>`;
                    } else {
                        html += `<div style="margin-top:5px"><a href="${att.url}" style="color:#00aff4">📄 ${att.name}</a></div>`;
                    }
                });
            }

            // Embeds
            if (msg.embeds.length > 0) {
                msg.embeds.forEach(embed => {
                    const color = embed.hexColor || '#202225';
                    html += `<div class="embed" style="border-left-color: ${color}">`;
                    if (embed.title) html += `<div class="embed-title">${escapeHTML(embed.title)}</div>`;
                    if (embed.description) html += `<div class="embed-desc">${escapeHTML(embed.description).replace(/\n/g, '<br>')}</div>`;

                    if (embed.fields && embed.fields.length > 0) {
                        embed.fields.forEach(field => {
                            html += `<div class="embed-field">
                                <div class="field-name">${escapeHTML(field.name)}</div>
                                <div class="field-value">${escapeHTML(field.value).replace(/\n/g, '<br>')}</div>
                            </div>`;
                        });
                    }
                    if (embed.footer && embed.footer.text) html += `<div style="font-size:11px; margin-top:5px; color:#72767d">${escapeHTML(embed.footer.text)}</div>`;
                    html += `</div>`;
                });
            }

            html += `
            </div>
        </div>`;
        }

        html += `
    </div>
</body>
</html>`;

        const buffer = Buffer.from(html, 'utf-8');
        return new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });
    }
};
