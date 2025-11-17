# 📚 Guide Utilisation du Nouveau Logger

## 🎯 Vue d'ensemble

Le nouveau système de logs `src/utils/logger.js` est un **Singleton** qui centralise tous les logs du bot.

**Localisation :** `data/logs/`
- `combined.log` - Tous les logs
- `error.log` - Erreurs critiques uniquement
- `debug.log` - Logs de débogage (si `LOG_LEVEL=debug`)

---

## 🚀 Utilisation Simple

### Importer le logger
```javascript
const logger = require('../utils/logger');
```

### Les 5 Niveaux

#### 1. **INFO** (Bleu 🔵)
Messages informatifs généraux
```javascript
logger.info('Connexion à la base de données...');
logger.info('Utilisateur', username, 'connecté');  // Plusieurs paramètres
```

#### 2. **SUCCESS** (Vert 🟢)
Opérations réussies
```javascript
logger.success('Bot démarré avec succès!');
logger.success('Rôle assigné à', username);
```

#### 3. **WARN** (Jaune 🟡)
Avertissements
```javascript
logger.warn('Le rôle n\'existe pas');
logger.warn('Permissions insuffisantes pour le modérateur');
```

#### 4. **ERROR** (Rouge 🔴)
Erreurs critiques
```javascript
logger.error('Erreur base de données:', error.message);
logger.error('Impossible de charger la commande');
```
**Spécifique :** Écrit AUSSI dans `error.log`

#### 5. **DEBUG** (Magenta 🟣)
Infos de débogage (uniquement si `LOG_LEVEL=debug`)
```javascript
logger.debug('Variable x =', x);
logger.debug('État du cache:', cache);
```

#### 6. **COMMAND** (Cyan 🔵)
Tracer les commandes exécutées
```javascript
logger.command('RANKPANEL ADD: Rôle aux', username);
logger.command('BAN: Utilisateur', userId, 'by', moderator);
```

---

## 💾 Écriture dans les Fichiers

### Timestamps
Chaque log a un timestamp français automatique :
```
[17/11/2025 15:30:45] [INFO] Message...
```

### Exemple de Logs Générés

**data/logs/combined.log :**
```
[17/11/2025 15:30:00] [INFO] Bot démarrant...
[17/11/2025 15:30:01] [SUCCESS] Connecté à Discord
[17/11/2025 15:30:02] [COMMAND] /help utilisé par Admin
[17/11/2025 15:30:05] [ERROR] Erreur lecture fichier
[17/11/2025 15:30:10] [WARN] Cooldown atteint
```

**data/logs/error.log :**
```
[17/11/2025 15:30:05] [ERROR] Erreur lecture fichier
[17/11/2025 15:30:15] [ERROR] Base de données indisponible
```

---

## 🔧 Configurations

### Variable d'Environnement (.env)

```env
# Niveau de logs (par défaut : 'info')
LOG_LEVEL=info      # Affiche : info, success, warn, error, command
LOG_LEVEL=debug     # Affiche : tout + debug
LOG_LEVEL=warn      # Affiche : warn, error, command seulement
```

---

## 🛠️ Méthodes Avancées

### Nettoyer les Vieux Logs
```javascript
// Supprimer logs > 7 jours
logger.cleanOldLogs(7);

// Supprimer logs > 30 jours
logger.cleanOldLogs(30);
```

**Note :** Les fichiers `.gitkeep` ne seront pas supprimés.

### Obtenir la Taille des Logs
```javascript
const sizeInMB = logger.getLogsSize();
console.log(`Taille logs: ${sizeInMB} MB`);

// Résultat: "Taille logs: 2.45 MB"
```

---

## 📋 Exemples Concrets par Domaine

### 🤖 Commandes
```javascript
module.exports = {
    async execute(message, args, client) {
        logger.command(`/help utilisé par ${message.author.tag}`);
        
        try {
            // ... code de commande
            logger.success(`Commande exécutée par ${message.author.tag}`);
        } catch (error) {
            logger.error('Erreur commande:', error.message);
        }
    }
};
```

### 🛡️ Modération
```javascript
// Ban un utilisateur
logger.info(`Bannissement de ${user.tag}...`);
await user.ban();
logger.success(`${user.tag} a été banni`);
logger.command(`BAN: ${user.tag} par ${moderator.tag}`);
```

### 🗄️ Base de Données
```javascript
logger.info('Connexion BD...');
const db = new Database(dbPath);
logger.success('BD connectée:', dbPath);

logger.debug('Requête exécutée:', query);  // Seulement si LOG_LEVEL=debug
```

### ⚠️ Gestion d'Erreurs
```javascript
try {
    // opération risquée
} catch (error) {
    logger.error('Contexte de l\'erreur:', error.message);
    logger.warn('Tentative de récupération...');
    // retry logic
}
```

---

## 🚨 Gestion des Erreurs d'Écriture

**Sécurité :** Si l'écriture dans un fichier échoue :
- ✅ L'erreur est affichée dans la console
- ✅ Le bot **ne crash pas**
- ✅ Les logs continuent dans la console

```javascript
// Ceci ne causera JAMAIS de crash :
logger.error('Erreur grave'); // Même si data/logs/ n'existe pas
```

---

## 📊 Monitoring

### Vérifier les Logs
```bash
# Tous les logs
cat data/logs/combined.log

# Seulement les erreurs
cat data/logs/error.log

# Seulement les debug
cat data/logs/debug.log

# Derniers 10 logs
tail -10 data/logs/combined.log

# Chercher un utilisateur
grep "username" data/logs/combined.log
```

### En Temps Réel
```bash
# Windows
Get-Content data/logs/combined.log -Wait

# Linux/Mac
tail -f data/logs/combined.log
```

---

## ✅ Checklist d'Intégration

- [ ] Import du logger : `const logger = require('../utils/logger');`
- [ ] Utiliser `logger.info()` pour les messages généraux
- [ ] Utiliser `logger.success()` pour les opérations réussies
- [ ] Utiliser `logger.warn()` pour les avertissements
- [ ] Utiliser `logger.error()` dans les catch blocks
- [ ] Utiliser `logger.command()` pour tracer les commandes
- [ ] Vérifier que les fichiers sont bien créés dans `data/logs/`

---

## 🎯 Bonnes Pratiques

### ✅ À Faire
```javascript
// Bon : informatif et clair
logger.info(`Utilisateur ${user.tag} a rejoint le serveur`);
logger.error(`Erreur base de données: ${error.message}`);

// Bon : utiliser plusieurs paramètres
logger.command('KICK', user.tag, 'by', moderator.tag);
```

### ❌ À Éviter
```javascript
// Mauvais : vague
logger.info('OK');

// Mauvais : concaténation complexe
logger.error('Error: ' + error.code + ' - ' + error.message);

// Mauvais : oublier les niveaux
console.log('info');  // Utilisez logger.info() à la place
```

---

## 🔄 Rotation des Logs

Pour implémenter une rotation quotidienne (optionnel) :

```javascript
// Ajouter dans src/core/index.js
setInterval(() => {
    logger.info('🔄 Nettoyage des vieux logs (>7 jours)');
    logger.cleanOldLogs(7);
}, 24 * 60 * 60 * 1000);  // Tous les jours
```

---

## 📞 Support

Si le logger ne fonctionne pas :

1. **Vérifier que `data/logs/` existe**
   ```bash
   ls -la data/logs/
   ```

2. **Vérifier les permissions**
   - Windows : Démarrer VS Code en Admin

3. **Vérifier .env**
   ```bash
   cat .env | grep LOG_LEVEL
   ```

4. **Vérifier chalk est installé**
   ```bash
   npm list chalk
   ```

---

✅ **Le logger est prêt à utiliser !**

Pour plus d'infos, voir `MIGRATION_NOTES.md`
