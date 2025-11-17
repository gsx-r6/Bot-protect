# 🛡️ Bot-Protect - Discord Bot de Modération Ultra-Sécurisé

**Version :** 1.0.0  
**Dernière mise à jour :** 17 Novembre 2025  
**État :** ✅ Restructuration Complète

---

## 📚 Table des Matières

1. [Démarrage Rapide](#-démarrage-rapide)
2. [Architecture](#-architecture)
3. [Fonctionnalités](#-fonctionnalités)
4. [Installation](#-installation)
5. [Configuration](#-configuration)
6. [Utilisation du Logger](#-utilisation-du-logger)
7. [Structure des Données](#-structure-des-données)
8. [Dépannage](#-dépannage)
9. [Documentation](#-documentation)

---

## 🚀 Démarrage Rapide

### Installation
```bash
npm install
```

### Lancement
```bash
npm start              # Production
npm run dev           # Développement (avec nodemon)
```

### Vérification
```bash
node validate.js      # Valider la structure
cat data/logs/combined.log  # Voir les logs
```

---

## 🏗️ Architecture

### Stack Technologique
- **Runtime :** Node.js 18+
- **Framework :** Discord.js v14
- **Base de données :** SQLite3 (better-sqlite3)
- **Logger :** Système personnalisé (chalk + fichiers)
- **Gestionnaire paquets :** npm

### Structure du Projet

```
Bot-protect/
│
├── src/                          # Code source
│   ├── commands/                 # Commandes Discord
│   │   ├── administration/       # Admin commands
│   │   ├── moderation/          # Mod commands
│   │   ├── security/            # Security commands
│   │   ├── information/          # Info commands
│   │   ├── logging/             # Logging commands
│   │   ├── staff/               # Staff commands
│   │   ├── system/              # System commands
│   │   └── utility/             # Utility commands
│   │
│   ├── core/                     # Cœur du bot
│   │   ├── index.js             # Point d'entrée
│   │   ├── client.js            # Client Discord.js
│   │   └── envLoader.js         # Chargement .env
│   │
│   ├── database/                # Gestion BDD
│   │   └── database.js          # Classe Database
│   │
│   ├── events/                  # Gestionnaires événements
│   │   ├── client/              # Événements bot
│   │   ├── guild/               # Événements serveur
│   │   └── message/             # Événements messages
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
│   │   ├── antiSpam.js
│   │   ├── memberProtector.js
│   │   ├── roleProtector.js
│   │   └── securityAudit.js
│   │
│   ├── services/                # Services
│   │   ├── AutomodService.js
│   │   ├── CacheService.js
│   │   ├── ConfigService.js
│   │   └── RankPermissionService.js
│   │
│   └── utils/                   # Utilitaires
│       ├── logger.js            # Logger personnalisé
│       ├── embeds.js            # Constructeurs embeds
│       └── validators.js        # Validateurs
│
├── data/                         # Données générées (runtime)
│   ├── logs/                    # 📊 Logs du bot
│   │   ├── combined.log         # Tous les logs
│   │   ├── error.log            # Erreurs uniquement
│   │   └── debug.log            # Debug (si activé)
│   │
│   ├── database/                # 🗄️ Base de données
│   │   └── haruka.db            # SQLite
│   │
│   ├── cache/                   # 💾 Cache temporaire
│   └── backups/                 # 💿 Sauvegardes
│
├── tests/                        # Tests
│   └── serverinfo.test.js
│
├── .env.example                 # Template variables env
├── .env                         # Variables d'environnement (git ignored)
├── .eslintrc.json              # Configuration ESLint
├── .gitignore                  # Fichiers ignorés Git
├── package.json                # Dépendances
├── README.md                   # Ce fichier
├── QUICK_START.md              # Guide rapide (2 min)
├── LOGGER_GUIDE.md             # Guide du logger
├── CHANGES_LIST.md             # Liste des changements
└── SECURITY.md                 # Politique sécurité
```

---

## ✨ Fonctionnalités

### 🛡️ Modération
- Ban, Kick, Warn, Mute, Timeout, TempBan, Nuke, Purge, Slowmode
- Système de sanctions complet
- Checkwarns, Delwarn, Warnings
- Anti-link, Anti-spam, Anti-flood, Anti-mention
- Anti-raid, Anti-nuke, Anti-bot
- Anti-edit, Anti-joinraid

### 📊 Système de Ranks
- Hiérarchie de rôles personnalisée
- Permissions granulaires
- Panel interactif avec pagination
- Gestion des autorisations par rôle

### 📝 Logging
- Logs des messages supprimés
- Logs des arrivées/départs
- Logs des actions vocales
- Logs des modérations
- Séparation erreurs/info/debug

### 🎟️ Tickets
- Création/Gestion automatique
- Support complet

### ✅ Administration
- Auto-role
- Vérification des membres
- Statut configurables
- Setup serveur

### 👥 Staff
- Notes sur utilisateurs
- Rapports
- Broadcasts
- Listes staff

### 🧠 Services Avancés
- AutoMod (détection spam, flood, etc.)
- Cache performant
- Configuration persistante
- Audit de sécurité

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
DISCORD_TOKEN=votre_token_ici
CLIENT_ID=votre_client_id

# Database
DATABASE_TYPE=sqlite
SQLITE_PATH=data/database/haruka.db

# Logs
LOG_LEVEL=info              # info, debug, warn, error

# Sécurité
SECURITY_AUDIT_ON_START=false
SECURITY_BLOCK_ON_VULNERABILITIES=false
```

### Structure des Données

**Base de données (SQLite) - `data/database/haruka.db`**

Tables principales :
- `guild_config` - Configuration par serveur
- `warnings` - Système d'avertissements
- `sanctions` - Bans/kicks
- `tickets` - Système de tickets
- `notes` - Notes staff
- `rank_permissions` - Permissions de ranks
- `user_data` - Données utilisateurs

---

## 🎨 Utilisation du Logger

### Niveaux de Log

```javascript
const logger = require('./utils/logger');

logger.info('Message informatif');           // Bleu
logger.success('Opération réussie');         // Vert
logger.warn('Avertissement');                // Jaune
logger.error('Erreur critique');             // Rouge
logger.debug('Info de débogage');            // Magenta
logger.command('Commande exécutée');         // Cyan
```

### Fichiers Logs

Les logs sont sauvegardés dans `data/logs/` :
- `combined.log` - Tous les logs
- `error.log` - Erreurs uniquement
- `debug.log` - Debug (si `LOG_LEVEL=debug`)

### Monitoring

```bash
# Voir les logs en temps réel (Linux/Mac)
tail -f data/logs/combined.log

# Voir les logs (Windows)
Get-Content data/logs/combined.log -Wait

# Voir seulement les erreurs
cat data/logs/error.log
```

**Pour plus de détails → Voir `LOGGER_GUIDE.md`**

---

## 📊 Structure des Données

### Schéma Base de Données

```sql
-- Configuration du serveur
CREATE TABLE guild_config (
    guild_id TEXT PRIMARY KEY,
    prefix TEXT DEFAULT '+',
    welcome_channel TEXT,
    log_channel TEXT,
    modlog_channel TEXT,
    ...
);

-- Avertissements
CREATE TABLE warnings (
    id INTEGER PRIMARY KEY,
    guild_id TEXT,
    user_id TEXT,
    moderator_id TEXT,
    reason TEXT,
    created_at TEXT
);

-- Permissions de ranks
CREATE TABLE rank_permissions (
    guild_id TEXT,
    role_id TEXT,
    can_give_roles TEXT,  -- JSON array
    PRIMARY KEY (guild_id, role_id)
);
```

---

## 🧪 Validation & Tests

### Valider la structure complète
```bash
node validate.js
```

Résultat attendu : **🟢 VALIDATION RÉUSSIE - 26/26 tests**

### Tests automatisés
```bash
npm test
```

### Audit de sécurité
```bash
npm run security-audit
```

---

## 🐛 Dépannage

### Problème : Le bot ne démarre pas

**Solution :**
1. Vérifier le token Discord : `echo $DISCORD_TOKEN`
2. Vérifier les permissions du bot sur Discord
3. Vérifier les logs : `cat data/logs/error.log`

### Problème : Les logs ne s'affichent pas

**Solution :**
```bash
# Vérifier que le dossier existe
ls -la data/logs/

# Vérifier les permissions
chmod 755 data/logs

# Relancer le bot
npm start
```

### Problème : Database locked

**Solution :**
```bash
# Tuer tous les processus node
pkill node          # Linux/Mac
taskkill /IM node.exe /F  # Windows

# Relancer
npm start
```

### Problème : Chalk n'est pas trouvé

**Solution :**
```bash
npm install chalk@4.1.2
npm start
```

---

## 📚 Documentation

### Documents Essentiels

| Document | Contenu | Lire si... |
|----------|---------|-----------|
| **QUICK_START.md** | Démarrage 2 minutes | 👉 Vous êtes pressé |
| **LOGGER_GUIDE.md** | Guide complet du logger | 👉 Vous codez |
| **CHANGES_LIST.md** | Liste détaillée des changements | 👉 Vous auditez |
| **SECURITY.md** | Politique de sécurité | 👉 Vous déployez |

### Scripts Utiles

```bash
npm start              # Lancer le bot
npm run dev           # Mode développement
npm test              # Tests automatisés
npm run lint          # Linter le code
npm run security-audit # Audit sécurité
node validate.js      # Valider la structure
node status.js        # Voir le statut
```

---

## 🔐 Sécurité

**Points importants :**
- ✅ Ne jamais commiter le `.env` avec les tokens
- ✅ Utiliser des variables d'environnement
- ✅ Mettre à jour les dépendances régulièrement
- ✅ Activer l'audit de sécurité en production

**Voir `SECURITY.md` pour plus de détails**

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

- 📖 **Documentation** → Voir les fichiers .md ci-dessus
- 🧪 **Validation** → `node validate.js`
- 📊 **Logs** → `cat data/logs/combined.log`
- 🐛 **Problèmes** → Voir section Dépannage

---

## 📋 Checklist de Déploiement

- [ ] `.env` configuré avec token
- [ ] `npm install` exécuté
- [ ] `node validate.js` = ✅ OK
- [ ] Permissions bot Discord vérifiées
- [ ] `data/logs/` créé automatiquement au démarrage
- [ ] Logs s'affichent en couleurs
- [ ] Bot démarre sans erreurs

---

## 🎯 Résumé Restructuration 2025

**Changements majeurs :**
- ✅ Logger.js retapé entièrement
- ✅ Structure `src/` + `data/` séparée
- ✅ Pagination rankpanel (tous les rôles)
- ✅ .gitignore optimisé
- ✅ 26/26 validations automatiques

**Documentation :**
- ✅ 4 guides créés (QUICK_START, LOGGER, CHANGES, SECURITY)
- ✅ Scripts de validation et statut
- ✅ README.md centralisé

---

**✨ Le bot est prêt pour le déploiement !**

```bash
npm install && npm start
```

---

*Dernière mise à jour : 17 Novembre 2025*
