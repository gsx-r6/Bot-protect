# Architecture Technique : Bot-Protect "uhq-monde" (v3.1.0)

> **Type** : Brownfield (Documentant un système existant)
> **Stack** : Node.js, Discord.js v14, SQLite (better-sqlite3)

## 1. Vue d'Ensemble du Système
Le bot "uhq-monde" est une application monolithique Node.js agissant comme un bot de modération et de protection ultra-sécurisé pour serveurs Discord. Il utilise une architecture basée sur les événements (Event-Driven) classique pour les bots Discord.

### Diagramme de Contexte
```mermaid
graph TD
    User[Utilisateur Discord] -->|Intéragit via Commandes/Événements| DiscordAPI[Discord API]
    DiscordAPI -->|Websockets (Gateway)| BotProcess[Processus Node.js Bot]
    BotProcess -->|CRUD| SQLiteDB[(Database SQLite)]
    BotProcess -->|Logs| LogChannels[Salons de Logs Discord]
```

## 2. Composants Principaux (`src/`)

### 2.1 Services Centraux (`src/services/`)
- **`LogService` (Centralisé)** : Remplace l'ancien `LoggerService`. Fournit une interface unique pour tous les types de logs (Moderation, Messages, Voice, Security, Automod). Utilise un cache de canaux et une table `logger_channels` pour la persistance.
- **`BackupService`** : Fournit les méthodes de création, listing et restauration de serveurs. Intégré à la commande `+backup`.
- **`ConfigService`** : Gère les configurations de guilde (préfixe, couleurs, etc.) avec mise en cache.
- **`AutomodService`** : Gère les seuils et paramètres de l'anti-raid et anti-spam en base de données.

### 2.2 Module de Sécurité (`src/security/`)
- **`RoleProtector`** : Surveille les événements `roleUpdate`/`roleDelete`. Restaure les permissions critiques via snapshots. Les snapshots sont désormais **persistants en base de données** (`role_snapshots`), garantissant une restauration immédiate même après un reboot.
- **`AntiRaid` / `AntiSpam`** : Détectent les pics d'arrivées ou d'envois. Le mode raid utilise un timestamp de début persistant (`raid_states`) pour assurer une continuité de protection précise après redémarrage.

### 2.3 Commandes Consolidées (`src/commands/`)
L'architecture tend vers des commandes multifonctions pour simplifier l'interaction :
- **`backup.js`** : Gère tout le cycle de vie des sauvegardes (`create`, `list`, `load`).
- **`setlogger.js`** : Configuration interactive de toutes les catégories de logs.
- **`clear.js`** : Commande haute performance de nettoyage incluant des fonctionnalités de purge avancées.
- **`lock.js` vs `lockdown.js`** : Distinction claire entre verrouillage de salon et verrouillage global.

### 2.4 Système de Tickets (`src/events/interactions/ticketInteraction.js`)
Système de support complet avec transcrits HTML sécurisés (protection XSS via `transcriptHelper.js`) et gestion stricte des permissions staff.

## 3. Modèle de Données (SQLite)
Le schéma est centralisé dans `src/database/schema.js`.

| Table | Description | Clé Primaire |
| :--- | :--- | :--- |
| **`guild_config`** | Config générale du bot. | `guild_id` |
| **`automod_config`** | Paramètres anti-raid/spam persistés par serveur. | `guild_id` |
| **`logger_channels`** | Mapping des types de logs vers salons Discord. | `guild_id` |
| **`sanctions` / `warnings`** | Historique modération et accumulatif. | `id` |

## 4. Dettes Techniques & Risques
1. **Couplage Services** : Certains services dépendent encore de structures globales du client.
2. **Audit Logs** : Dépendance aux Audit Logs Discord pour identifier les exécuteurs, ce qui peut être sujet à des délais.

## 5. Recommandations (Futur)
1. **Modularité** : Séparer davantage les handlers de commandes pour supporter l'auto-complétion Slash.
2. **Dashboard de Secours** : Envisager une interface légère pour le monitoring hors-Discord.
