# Bot-protect (UHQ Monde)

## 🛡️ Présentation
**Bot-protect** est un bot Discord robuste de modération et de sécurité conçu pour protéger les communautés contre les raids, le spam et les actions malveillantes. Il intègre une protection avancée des rôles (`RoleProtector`), un système anti-raid intelligent (`AntiRaid`) et une gestion dynamique de la configuration.

> **103+ commandes** réparties en **10 catégories** : Sécurité, Modération, Administration, Tickets, Logging, Utility, Information, Staff, System, Owner.

---

## 🚀 Fonctionnalités Clés

### 🔒 Sécurité & Protection (UHQ Ready)
- **Panic Button (URGENCE)** : Verrouillage total et instantané du serveur en une commande (`+panic`).
- **Anti-Raid Résilient** : Détecte les arrivées massives. L'état persiste après redémarrage.
- **Protecteur de Rôles Persistant** : Sauvegarde SQLite des snapshots de rôles critiques.
- **Systeme de Vérification** : Bouton sécurisé avec barrière anti-bypass pour les membres suspects.

### ⚙️ Modération & Gestion (Consolidée)
- **Modération UX** : Commandes simplifiées comme `+clear` (incluant purge avancée) et distinction entre `+lock` (salon) et `+lockdown` (serveur).
- **Backups Unifiés** : Gestion complète du cycle de vie des serveurs avec `+backup <create|list|load>`.
- **Logs Centralisés** : Configuration unique via le menu intelligent `+setlogger`.

### 🎫 Support & Tickets
- Système de tickets premium avec transcrits HTML sécurisés et gestion staff granulaire.

---

## 🛠️ Installation

### Prérequis
- Node.js >= 18.0.0
- SQLite3
- Build tools pour `@napi-rs/canvas` (optionnel, pour les images)
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
