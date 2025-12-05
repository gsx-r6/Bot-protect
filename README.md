# 🛡️ {+} uhq Monde - Bot Discord de Protection Ultra-Sécurisé

**Version :** 2.0.0  
**Dernière mise à jour :** Décembre 2024  
**État :** ✅ Production Ready

---

## 📚 Table des Matières

1. [Démarrage Rapide](#-démarrage-rapide)
2. [Fonctionnalités](#-fonctionnalités)
3. [Architecture](#-architecture)
4. [Installation](#-installation)
5. [Configuration](#-configuration)
6. [Système de Permissions](#-système-de-permissions)
7. [Protection Automatique](#-protection-automatique)
8. [Documentation](#-documentation)

---

## 🚀 Démarrage Rapide

### Installation
```bash
npm install
```

### Configuration
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

### Lancement
```bash
npm start              # Production
npm run dev           # Développement (avec nodemon)
```

---

## ✨ Fonctionnalités

### 🛡️ Système de Permissions Avancé
- **11 Niveaux de Permission** : Hiérarchie stricte (1 = Crown → 11 = Medal)
- **Rate Limiting** : Limites d'utilisation par heure pour chaque niveau
- **Hiérarchie Stricte** : Impossible de sanctionner un membre de niveau égal ou supérieur
- **Configuration Centralisée** : `src/config/permissions.js`

### 🚨 Protection Automatique
- **Anti-Link** : Suppression automatique des invitations Discord et liens suspects
- **Anti-Spam** : Détection de flood avec mute automatique (1 minute)
- **Filtre Mots-Clés** : Détection d'insultes et tentatives d'arnaque
- **Anti-Raid** : Protection contre les raids massifs
- **Anti-Nuke** : Protection des rôles et salons critiques

### 🔨 Modération Complète
- **Commandes** : Ban, Kick, Warn, Mute, Timeout, TempBan, Nuke, Purge
- **Système de Sanctions** : Historique complet avec raisons
- **Panel Interactif** : MutePanel avec boutons pour sanctions rapides
- **Warnings** : Système d'avertissements avec gestion

### 📊 Utilitaires & Informations
- **Snipe** : Récupération du dernier message supprimé (`+snipe`)
- **Avatar/Banner** : Affichage HD des photos de profil et bannières
- **Help Interactif** : Menu déroulant pour navigation par catégorie
- **ServerInfo** : Statistiques détaillées du serveur
- **UserInfo** : Informations complètes sur un membre

### 📝 Logging Avancé
- Logs des messages supprimés/édités
- Logs des arrivées/départs
- Logs des actions vocales
- Logs de modération
- Système de fichiers (combined.log, error.log, debug.log)

### 🎟️ Système de Tickets
- Création automatique avec boutons
- Gestion complète (fermeture, permissions)
- Stockage en base de données

### ⚙️ Administration
- Auto-role pour nouveaux membres
- Setup serveur interactif
- Configuration par serveur (prefix, couleurs, etc.)
- Statistiques en temps réel (membres, en ligne, vocal)

---

## 🏗️ Architecture

### Stack Technologique
- **Runtime** : Node.js 18+
- **Framework** : Discord.js v14
- **Base de données** : SQLite3 (better-sqlite3)
- **Logger** : Système personnalisé (chalk + fichiers)

### Structure du Projet

```
Bot-protect/
│
├── src/                          # Code source
│   ├── commands/                 # Commandes Discord
│   │   ├── administration/       # Commandes admin
│   │   ├── moderation/          # Commandes modération
│   │   ├── security/            # Commandes sécurité
│   │   ├── information/         # Commandes info (avatar, banner, etc.)
│   │   ├── logging/             # Commandes logging
│   │   ├── staff/               # Commandes staff
│   │   ├── system/              # Commandes système
│   │   └── utility/             # Utilitaires (help, snipe, perms, etc.)
│   │
│   ├── config/                   # Configuration
│   │   ├── config.js            # Config principale
│   │   └── permissions.js       # 🆕 Niveaux de permissions
│   │
│   ├── core/                     # Cœur du bot
│   │   ├── index.js             # Point d'entrée
│   │   ├── client.js            # NamiClient (Discord.js)
│   │   └── envLoader.js         # Chargement .env
│   │
│   ├── database/                # Gestion BDD
│   │   └── database.js          # Classe Database (SQLite)
│   │
│   ├── events/                  # Gestionnaires événements
│   │   ├── client/              # Événements bot (ready, etc.)
│   │   ├── guild/               # Événements serveur
│   │   └── message/             # 🆕 Événements messages
│   │       ├── messageCreate.js # Gestion commandes
│   │       ├── messageDelete.js # 🆕 Snipe system
│   │       ├── antiLink.js      # 🆕 Anti-Link
│   │       ├── antiSpam.js      # 🆕 Anti-Spam
│   │       └── keywordFilter.js # 🆕 Filtre mots-clés
│   │
│   ├── handlers/                # Gestionnaires
│   │   ├── commandHandler.js
│   │   ├── eventHandler.js
│   │   ├── cooldownHandler.js
│   │   └── permissionHandler.js
│   │
│   ├── jobs/                    # Tâches programmées
│   │   └── statsVoiceUpdater.js
│   │
│   ├── security/                # Modules sécurité
│   │   ├── antiBot.js
│   │   ├── antiRaid.js
│   │   ├── memberProtector.js
│   │   ├── roleProtector.js
│   │   └── securityAudit.js
│   │
│   ├── services/                # Services
│   │   ├── AutomodService.js
│   │   ├── CacheService.js
│   │   ├── ConfigService.js
│   │   ├── LogService.js
│   │   └── RankPermissionService.js
│   │
│   └── utils/                   # Utilitaires
│       ├── logger.js            # Logger personnalisé
│       ├── embeds.js            # Constructeurs embeds
│       ├── errorHandler.js      # Gestion erreurs
│       ├── validators.js        # Validateurs
│       └── PermissionHandler.js # 🆕 Gestionnaire permissions
│
├── data/                         # Données générées (runtime)
│   ├── logs/                    # 📊 Logs du bot
│   ├── database/                # 🗄️ Base de données
│   ├── cache/                   # 💾 Cache temporaire
│   └── backups/                 # 💿 Sauvegardes
│
├── .env.example                 # Template variables env
├── .env                         # Variables d'environnement
├── package.json                # Dépendances
├── README.md                   # Ce fichier
└── SECURITY.md                 # Politique sécurité
```

---

## 📥 Installation

### Prérequis
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm 8+
- Un serveur Discord
- Token Discord Bot

### Étapes

#### 1. Cloner le repository
```bash
git clone <repository-url>
cd Bot-protect
```

#### 2. Installer les dépendances
```bash
npm install
```

#### 3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

#### 4. Lancer le bot
```bash
npm start
```

---

## ⚙️ Configuration

### Variables d'Environnement (.env)

```env
# Bot
TOKEN=votre_token_discord
OWNER_ID=votre_id_utilisateur
PREFIX=+
EMBED_COLOR=#FF69B4

# Timezone
TZ=Europe/Paris

# Database
SQLITE_PATH=data/database/nami.db

# Logs
LOG_LEVEL=info              # info, debug, warn, error

# Sécurité
SECURITY_AUDIT_ON_START=false
SECURITY_BLOCK_ON_VULNERABILITIES=false

# Stats Channels (optionnel)
STATS_CHANNEL_MEMBERS=
STATS_CHANNEL_ONLINE=
STATS_CHANNEL_VOICE=

# Log Channels (optionnel)
LOG_CHANNEL_MODERATION=
LOG_CHANNEL_MEMBER=
LOG_CHANNEL_MESSAGE=
LOG_CHANNEL_VOICE=
```

---

## 🔐 Système de Permissions

### Configuration (`src/config/permissions.js`)

Le bot utilise un système de permissions à 11 niveaux :

```javascript
LEVELS: {
    1: {
        name: 'Crown',
        roles: ['ID_ROLE'],
        limits: { ban: Infinity, kick: Infinity, mute: Infinity }
    },
    2: {
        name: 'Star',
        roles: ['ID_ROLE'],
        limits: { ban: 20, kick: 20, mute: 50 }
    },
    // ... jusqu'au niveau 11
}
```

### Fonctionnement

1. **Hiérarchie** : Un membre de niveau 2 ne peut pas sanctionner un membre de niveau 1 ou 2
2. **Rate Limiting** : Chaque niveau a des limites d'utilisation par heure
3. **Bypass Owner** : Le propriétaire (OWNER_ID) bypass toutes les restrictions

### Configuration de vos rôles

Éditez `src/config/permissions.js` et remplacez les IDs par ceux de vos rôles :

```javascript
1: {
    name: 'Crown',
    roles: ['VOTRE_ROLE_ID_ICI'],
    limits: { ban: Infinity, kick: Infinity, mute: Infinity }
}
```

---

## 🚨 Protection Automatique

### Anti-Link
- Détecte et supprime les invitations Discord
- Détecte les liens HTTP suspects
- Configurable via base de données (`automod_config`)

### Anti-Spam
- Détecte le flood (5 messages en 5 secondes)
- Mute automatique de 1 minute
- Logs dans le salon de modération

### Filtre Mots-Clés
- Détection d'insultes
- Détection de tentatives d'arnaque (mentions d'argent)
- Alertes dans un salon dédié

### Activation

```sql
-- Activer l'anti-link pour un serveur
INSERT INTO automod_config (guild_id, antilink) VALUES ('GUILD_ID', 1);

-- Activer l'anti-spam
INSERT INTO automod_config (guild_id, antispam) VALUES ('GUILD_ID', 1);
```

Ou via commande (à implémenter) : `+automod antilink on`

---

## 📊 Commandes Principales

### Modération
- `+ban <@membre> [raison]` - Bannir un membre
- `+kick <@membre> [raison]` - Expulser un membre
- `+mute <@membre> [durée] [raison]` - Rendre muet un membre
- `+mutepanel <@membre>` - Panel interactif de mute
- `+warn <@membre> <raison>` - Avertir un membre
- `+purge <nombre> [@membre]` - Supprimer des messages

### Utilitaires
- `+help` - Menu d'aide interactif
- `+snipe` - Voir le dernier message supprimé
- `+avatar [@membre]` - Afficher l'avatar en HD
- `+banner [@membre]` - Afficher la bannière
- `+perms` - Voir le système de permissions
- `+serverinfo` - Informations du serveur
- `+userinfo [@membre]` - Informations d'un membre

### Administration
- `+setup` - Configuration interactive du serveur
- `+setcolor <couleur>` - Changer la couleur des embeds
- `+autorole <@role>` - Définir le rôle automatique

---

## 📚 Documentation

### Base de Données

Tables principales :
- `guild_config` - Configuration par serveur
- `automod_config` - 🆕 Configuration de l'automod
- `warnings` - Système d'avertissements
- `sanctions` - Historique des bans/kicks
- `tickets` - Système de tickets
- `rank_permissions` - Permissions de ranks
- `user_data` - Données utilisateurs

### Logger

```javascript
const logger = require('./utils/logger');

logger.info('Message informatif');
logger.success('Opération réussie');
logger.warn('Avertissement');
logger.error('Erreur critique');
logger.debug('Info de débogage');
logger.command('Commande exécutée');
```

Logs sauvegardés dans `data/logs/` :
- `combined.log` - Tous les logs
- `error.log` - Erreurs uniquement
- `debug.log` - Debug (si `LOG_LEVEL=debug`)

---

## 🔐 Sécurité

**Points importants :**
- ✅ Ne jamais commiter le `.env` avec les tokens
- ✅ Utiliser des variables d'environnement
- ✅ Mettre à jour les dépendances régulièrement
- ✅ Activer l'audit de sécurité en production
- ✅ Système de permissions strict
- ✅ Rate limiting sur les commandes de modération

**Voir `SECURITY.md` pour plus de détails**

---

## 🎯 Nouveautés v2.0

**Système de Permissions :**
- ✅ 11 niveaux configurables
- ✅ Rate limiting par niveau
- ✅ Hiérarchie stricte

**Protection Automatique :**
- ✅ Anti-Link (invitations Discord)
- ✅ Anti-Spam (flood detection)
- ✅ Filtre mots-clés (insultes/arnaques)

**Utilitaires :**
- ✅ Commande Snipe
- ✅ Commandes Avatar/Banner HD
- ✅ Help interactif avec menu déroulant

**Améliorations :**
- ✅ Code modulaire et propre
- ✅ Renommage Haruka → Nami
- ✅ Localisation française complète
- ✅ Timezone Europe/Paris

---

## 📝 Licence

MIT - Voir LICENSE pour plus de détails

---

## 🤝 Contribution

Les contributions sont bienvenues !

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📞 Support

- 📖 **Documentation** → README.md, SECURITY.md
- 🧪 **Validation** → `node validate.js`
- 📊 **Logs** → `cat data/logs/combined.log`
- 🐛 **Issues** → GitHub Issues

---

**✨ Le bot est prêt pour le déploiement !**

```bash
npm install && npm start
```

---

*Dernière mise à jour : Décembre 2024*
