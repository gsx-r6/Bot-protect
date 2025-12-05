# 🔐 {+} uhq Monde - Politique de Sécurité

**Version :** 2.0.0  
**Dernière mise à jour :** Décembre 2024

---

## 📋 Vue d'ensemble

Ce document décrit les mesures de sécurité implémentées dans **{+} uhq Monde** et les bonnes pratiques à suivre pour un déploiement sécurisé.

---

## 🛡️ Principes de Sécurité

### 1. Gestion des Secrets
- ✅ **Aucun secret en dur** dans le code source
- ✅ Utilisation exclusive de **variables d'environnement** (`.env`)
- ✅ `.env` ajouté au `.gitignore`
- ✅ Template `.env.example` fourni sans valeurs sensibles

### 2. Système de Permissions
- ✅ **Hiérarchie stricte** : 11 niveaux de permissions
- ✅ **Vérification hiérarchique** avant toute action de modération
- ✅ **Rate Limiting** : Limites d'utilisation par heure pour chaque niveau
- ✅ **Bypass Owner** : Seul le propriétaire (OWNER_ID) peut tout faire

### 3. Protection Automatique
- ✅ **Anti-Link** : Suppression automatique des invitations Discord
- ✅ **Anti-Spam** : Détection de flood avec mute automatique
- ✅ **Filtre Mots-Clés** : Détection d'insultes et tentatives d'arnaque
- ✅ **Anti-Raid** : Protection contre les raids massifs
- ✅ **Anti-Nuke** : Protection des rôles et salons critiques

### 4. Gestion des Erreurs
- ✅ **Try/catch** sur toutes les opérations sensibles
- ✅ **Logging complet** des erreurs dans `data/logs/error.log`
- ✅ **Graceful shutdown** en cas d'erreur critique
- ✅ **Handlers globaux** pour `unhandledRejection` et `uncaughtException`

### 5. Audit de Sécurité
- ✅ **Audit automatique** au démarrage (optionnel)
- ✅ Vérification des dépendances vulnérables
- ✅ Scan du code source pour secrets hardcodés
- ✅ Script : `npm run security-audit`

---

## 🔑 Configuration Sécurisée

### Variables d'Environnement Requises

```env
# OBLIGATOIRE
TOKEN=votre_token_discord          # Token du bot
OWNER_ID=votre_id_utilisateur      # ID du propriétaire

# RECOMMANDÉ
PREFIX=+                           # Préfixe des commandes
EMBED_COLOR=#FF69B4               # Couleur des embeds
TZ=Europe/Paris                   # Timezone

# SÉCURITÉ
SECURITY_AUDIT_ON_START=true      # Activer l'audit au démarrage
SECURITY_BLOCK_ON_VULNERABILITIES=false  # Bloquer si vulnérabilités détectées
LOG_LEVEL=info                    # Niveau de log (info, debug, warn, error)
```

### Permissions Discord Requises

Le bot nécessite les permissions suivantes :
- `MANAGE_ROLES` - Gestion des rôles
- `KICK_MEMBERS` - Expulser des membres
- `BAN_MEMBERS` - Bannir des membres
- `MANAGE_CHANNELS` - Gérer les salons
- `MANAGE_MESSAGES` - Gérer les messages
- `MODERATE_MEMBERS` - Timeout/Mute
- `VIEW_AUDIT_LOG` - Voir les logs d'audit
- `READ_MESSAGE_HISTORY` - Lire l'historique
- `SEND_MESSAGES` - Envoyer des messages
- `EMBED_LINKS` - Embeds
- `ATTACH_FILES` - Fichiers

**Lien d'invitation recommandé :**
```
https://discord.com/oauth2/authorize?client_id=VOTRE_CLIENT_ID&permissions=8&scope=bot
```

---

## 🚨 Système de Permissions

### Configuration (`src/config/permissions.js`)

Le système de permissions est le cœur de la sécurité du bot :

```javascript
OWNER_ID: process.env.OWNER_ID,  // Bypass total

LEVELS: {
    1: {
        name: 'Crown',
        level: 1,
        roles: ['ID_ROLE'],
        limits: { ban: Infinity, kick: Infinity, mute: Infinity }
    },
    // ... jusqu'au niveau 11
}
```

### Règles de Hiérarchie

1. **Niveau 1 > Niveau 2 > ... > Niveau 11**
2. Un membre ne peut **jamais** sanctionner :
   - Un membre de niveau supérieur ou égal
   - Lui-même
   - Le propriétaire (OWNER_ID)
3. Le bot vérifie **automatiquement** la hiérarchie avant chaque action

### Rate Limiting

Chaque niveau a des limites d'utilisation par heure :

| Niveau | Ban/h | Kick/h | Mute/h |
|--------|-------|--------|--------|
| 1      | ∞     | ∞      | ∞      |
| 2      | 20    | 20     | 50     |
| 3      | 10    | 15     | 30     |
| 4      | 5     | 10     | 20     |
| 5      | 2     | 5      | 15     |
| 6+     | 0     | 0-2    | 0-10   |

---

## 🔒 Protection Automatique

### Anti-Link (`src/events/message/antiLink.js`)

**Fonctionnement :**
- Détecte les invitations Discord (`discord.gg/`, `discord.com/invite/`)
- Détecte les liens HTTP suspects
- Supprime automatiquement le message
- Envoie une notification temporaire

**Activation :**
```sql
INSERT INTO automod_config (guild_id, antilink) VALUES ('GUILD_ID', 1);
```

**Exceptions :**
- Membres avec permission `MANAGE_MESSAGES`
- Administrateurs

### Anti-Spam (`src/events/message/antiSpam.js`)

**Fonctionnement :**
- Détecte le flood (5 messages en 5 secondes)
- Mute automatique de 1 minute
- Log dans le salon de modération

**Activation :**
```sql
INSERT INTO automod_config (guild_id, antispam) VALUES ('GUILD_ID', 1);
```

**Exceptions :**
- Membres avec permission `MODERATE_MEMBERS`
- Administrateurs

### Filtre Mots-Clés (`src/events/message/keywordFilter.js`)

**Fonctionnement :**
- Détecte les insultes (liste configurable)
- Détecte les tentatives d'arnaque (mentions d'argent + PayPal/virement)
- Envoie une alerte dans un salon dédié (ID hardcodé : `1440404482541355212`)

**Note :** Ce module est **toujours actif** et ne nécessite pas de configuration.

---

## 🗄️ Sécurité de la Base de Données

### SQLite (`data/database/nami.db`)

**Bonnes pratiques :**
- ✅ Base de données **locale** (pas d'exposition réseau)
- ✅ Utilisation de **prepared statements** (protection SQL injection)
- ✅ Sauvegarde régulière recommandée
- ✅ Permissions fichier : `chmod 600 data/database/nami.db`

### Tables Sensibles

- `guild_config` - Configuration par serveur
- `automod_config` - Configuration de l'automod
- `warnings` - Historique des avertissements
- `sanctions` - Historique des bans/kicks
- `user_data` - Données utilisateurs (RGPD)

**Suppression de données utilisateur :**
```javascript
db.deleteUserData(userId);  // Conforme RGPD
```

---

## 📊 Logging et Audit

### Fichiers de Logs

Les logs sont stockés dans `data/logs/` :
- `combined.log` - Tous les logs
- `error.log` - Erreurs uniquement
- `debug.log` - Debug (si `LOG_LEVEL=debug`)

**Rotation recommandée :** 30 jours

### Audit de Sécurité

**Lancer l'audit :**
```bash
npm run security-audit
```

**Vérifications effectuées :**
- Dépendances vulnérables (`npm audit`)
- Secrets hardcodés dans le code
- Permissions fichiers
- Configuration `.env`

---

## 🚀 Déploiement Sécurisé

### Checklist de Déploiement

- [ ] `.env` configuré avec **token valide**
- [ ] `OWNER_ID` défini
- [ ] `.env` **non commité** (vérifier `.gitignore`)
- [ ] `SECURITY_AUDIT_ON_START=true` en production
- [ ] Permissions Discord vérifiées
- [ ] `src/config/permissions.js` configuré avec vos rôles
- [ ] Base de données sauvegardée régulièrement
- [ ] Logs monitored (alertes sur erreurs)
- [ ] Dépendances à jour (`npm update`)

### Environnement de Production

**Recommandations :**
- Utiliser un **process manager** (PM2, systemd)
- Activer les **logs rotatifs**
- Configurer des **alertes** sur erreurs critiques
- **Sauvegarder** `data/database/` quotidiennement
- **Monitorer** l'utilisation CPU/RAM
- **Limiter** l'accès SSH au serveur

---

## 🐛 Signalement de Vulnérabilités

Si vous découvrez une vulnérabilité de sécurité, **ne la divulguez pas publiquement**.

**Procédure :**
1. Envoyez un email à : `security@votre-domaine.com`
2. Décrivez la vulnérabilité en détail
3. Fournissez des étapes de reproduction si possible
4. Attendez une réponse sous 48h

**Nous nous engageons à :**
- Répondre sous 48h
- Corriger les vulnérabilités critiques sous 7 jours
- Vous créditer dans les notes de version (si souhaité)

---

## 📝 Conformité RGPD

### Données Collectées

Le bot collecte et stocke :
- IDs Discord (utilisateurs, serveurs, rôles)
- Historique des sanctions (warnings, bans, kicks)
- Messages supprimés (temporairement, en mémoire pour `+snipe`)
- Données de configuration par serveur

### Droits des Utilisateurs

Les utilisateurs peuvent :
- **Demander la suppression** de leurs données : Commande `+profile delete`
- **Consulter** leurs données : Commande `+profile view`
- **Exporter** leurs données : (à implémenter)

### Rétention des Données

- **Sanctions** : Conservées indéfiniment (historique de modération)
- **Messages snipe** : Conservés en mémoire jusqu'au redémarrage du bot
- **Tickets** : Conservés 90 jours après fermeture
- **Logs** : Conservés 30 jours (rotation)

---

## 🔄 Mises à Jour de Sécurité

### Dépendances

**Vérifier les vulnérabilités :**
```bash
npm audit
```

**Corriger automatiquement :**
```bash
npm audit fix
```

**Mettre à jour :**
```bash
npm update
```

### Changelog de Sécurité

**v2.0.0 (Décembre 2024) :**
- ✅ Système de permissions avec hiérarchie stricte
- ✅ Rate limiting sur commandes de modération
- ✅ Anti-Link, Anti-Spam, Filtre mots-clés
- ✅ Audit de sécurité automatique
- ✅ Gestion RGPD (suppression données)

---

## 📞 Contact

Pour toute question de sécurité :
- **Email** : security@votre-domaine.com
- **Discord** : Votre serveur de support
- **GitHub** : Issues (pour bugs non-sensibles)

---

**✨ Sécurité avant tout !**

*Dernière mise à jour : Décembre 2024*
