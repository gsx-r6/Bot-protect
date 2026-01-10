# Bot-protect (UHQ Monde)

## 🛡️ Présentation
**Bot-protect** est un bot Discord robuste de modération et de sécurité conçu pour protéger les communautés contre les raids, le spam et les actions malveillantes. Il intègre une protection avancée des rôles (`RoleProtector`), un système anti-raid intelligent (`AntiRaid`) et une gestion dynamique de la configuration.

---

## 🚀 Fonctionnalités Clés

### 🔒 Sécurité
- **Anti-Raid** : Détecte les arrivées massives (Raids) basées sur des seuils dynamiques.
  - *Action* : Active automatiquement le "Mode Raid" et met les nouveaux membres en quarantaine.
  - *Persistance* : L'état du raid survit aux redémarrages du bot.
- **Protecteur de Rôles (Role Protector)** : Surveille activement les rôles critiques (AutoRole, Quarantaine, Staff Ticket).
  - *Vérification d'Intégrité* : Vérifie l'existence des rôles toutes les 5 minutes. Répare automatiquement les suppressions ou les ajouts de permissions dangereuses.
  - *Audit* : Alertes MP envoyées au propriétaire pour les événements à haut risque.

### ⚙️ Modération
- **Auto-Mod** : Filtres configurables (liens, majuscules, mentions, etc.).
- **Sanctions** : Gestion des Avertissements (Warn), Expulsions (Kick), Bannissements (Ban), Muets (Mute).
- **Logs** : Salons de logs granulaires pour toutes les actions (ModLog, AutoModLog, etc.).

### 🎫 Tickets
- Système de tickets complet avec transcripts.
- Catégories et rôles staff configurables par serveur.

---

## 🛠️ Installation

### Prérequis
- Node.js >= 18.0.0
- SQLite3

### Configuration
1. **Cloner le dépôt** :
   ```bash
   git clone <repo-url>
   cd Bot-protect
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer l'Environnement** :
   Créez un fichier `.env` (copiez `.env.example`) :
   ```env
   TOKEN=votre_token_discord
   CLIENT_ID=votre_client_id
   SQLITE_PATH=./data/nami.db
   ```
   *Note : `ANTIRAID_THRESHOLD` et `ANTIRAID_TIMEFRAME` sont maintenant configurés dynamiquement via le bot, mais des valeurs par défaut peuvent être définies ici.*

4. **Démarrer le Bot** :
   ```bash
   npm start
   ```

---

## 📚 Guide de Configuration

### Anti-Raid
Configurez les paramètres via la base de données/commandes (fonctionnalité future) ou fiez-vous aux valeurs par défaut intelligentes :
- **Seuil (Threshold)** : 10 arrivées (Défaut)
- **Fenêtre (Timeframe)** : 10 secondes (Défaut)

### Protection de Rôles
Le bot protège automatiquement :
1. Les rôles définis comme `autorole_id` dans la configuration.
2. Le rôle `quarantine_role_id` (utilisé pour l'Anti-Raid).
3. Le rôle `staff_role` de la configuration des Tickets.

*Pour ajouter un rôle à la protection, assurez-vous qu'il est défini comme l'un de ces rôles clés.*

---

## 🏗️ Architecture

- **Cœur** : Client `Discord.js` avec gestionnaires d'événements.
- **Base de Données** : `better-sqlite3` (SQLite) pour un stockage local robuste.
- **Sécurité** : Modules dédiés (`AntiRaid`, `RoleProtector`) fonctionnant indépendamment des commandes.

---

## 🤝 Contribuer
Les contributions sont les bienvenues ! Merci de tester minutieusement tout changement lié à la sécurité.
