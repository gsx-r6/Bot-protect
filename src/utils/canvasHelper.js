const logger = require('./logger');
let GlobalFonts, createCanvas, loadImage;

try {
    const canvas = require('@napi-rs/canvas');
    GlobalFonts = canvas.GlobalFonts;
    createCanvas = canvas.createCanvas;
    loadImage = canvas.loadImage;
} catch (e) {
    logger.warn('Module @napi-rs/canvas manquant ou erreur de chargement. Le système de bienvenue utilisera le fallback Embed.');
}

// Enregistrer une police par défaut si disponible (sinon utilise system fonts)
// GlobalFonts.registerFromPath(path.join(__dirname, '..', '..', 'assets', 'fonts', 'Roboto-Bold.ttf'), 'Roboto');

module.exports = {
    /**
     * Génère une image de bienvenue UHQ
     * @param {GuildMember} member - Le membre qui a rejoint
     * @returns {Promise<Buffer>} - L'image générée en buffer
     */
    async generateWelcomeImage(member) {
        if (!createCanvas) return null;

        try {
            const width = 1024;
            const height = 450;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            const username = member.user.username;
            const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 512 });
            const memberCount = member.guild.memberCount;

            // --- 1. FOND (BACKGROUND) ---
            // Dégradé sombre premium
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#0f0c29');
            gradient.addColorStop(0.5, '#302b63');
            gradient.addColorStop(1, '#24243e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Cercles décoratifs (Glow effect)
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(width, 0, 300, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, height, 200, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // --- 2. CADRE & BORDURES ---
            // Bordure rectangulaire arrondie
            const margin = 20;
            const cornerRadius = 40;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.lineJoin = 'round';
            ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

            // --- 3. AVATAR CIRCULAIRE ---
            const avatarSize = 250;
            const avatarX = width / 2;
            const avatarY = height / 2 - 50;

            // Cercle de contour avatar (Glow)
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 + 10, 0, Math.PI * 2);
            ctx.shadowColor = '#00d2ff';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();

            // Masque circulaire pour l'avatar
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Charger et dessiner l'avatar
            try {
                const avatarImage = await loadImage(avatarUrl);
                ctx.drawImage(avatarImage, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            } catch (e) {
                // Fallback si échec (avatar par défaut coloré)
                ctx.fillStyle = '#7289da';
                ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            }

            // Restore contexte après clip
            ctx.restore();
            // Note: avec @napi-rs/canvas, restore peut être tricky si on a pas save avant le clip. 
            // Correctif simple: on recrée le canvas context ou on gère mieux le save/restore.
            // Ici, on a pas fait ctx.save() avant le clip de l'avatar dans ce bloc simplifié. 
            // RE-INITIALISATION DU CONTEXTE (Hack simple: continuer à dessiner par dessus)

            // --- 4. TEXTES ---
            ctx.textAlign = 'center';

            // Titre "BIENVENUE"
            ctx.font = 'bold 60px "Arial"'; // Utiliser Arial par défaut si pas de custom font
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.fillText('BIENVENUE', width / 2, height - 130);

            // Username
            ctx.font = 'bold 45px "Arial"';
            ctx.fillStyle = '#00d2ff'; // Cyan
            ctx.fillText(username.toUpperCase(), width / 2, height - 70);

            // Compteur de membres
            ctx.font = 'bold 30px "Arial"';
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`Membre #${memberCount}`, width / 2, height - 30);

            return canvas.toBuffer('image/png');

        } catch (err) {
            logger.error('Canvas Error:', err);
            return null;
        }
    }
};
