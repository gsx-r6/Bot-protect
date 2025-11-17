# 🛡️ Système d'Erreurs Amélioré - Haruka Protect

## 📋 Vue d'ensemble

Le nouveau système d'erreurs offre des messages d'erreur détaillés et contextuels pour les utilisateurs du bot. Le bot répond **UNIQUEMENT** aux commandes valides et fournit une aide complète en cas d'erreur.

## 🎯 Fonctionnalités principales

### ✅ Embeds d'erreur contextuels

Le système distingue les types d'erreurs et fournit des informations appropriées :

| Type d'erreur | Contenu | Exemple |
|---|---|---|
| **Arguments manquants** | Usage + Description + Exemple | "Utilisez `+ban @user [raison]`" |
| **Permissions insuffisantes** | Détail des permissions requises | "Vous avez besoin de 'Gérer les rôles'" |
| **Cooldown** | Temps d'attente en secondes | "Attendez 5s avant de réutiliser" |
| **Commande non trouvée** | Conseil pour la liste des commandes | "Utilisez `+help` pour les commandes" |
| **Erreur d'exécution** | Message d'erreur + Stack (dev) | Détails techniques |

### 🤫 Silence sur commandes invalides

- ❌ Pas de réponse pour les commandes non valides (protection spam)
- ✅ Réponse embed détaillée UNIQUEMENT pour les commandes reconnues
- ✅ Le bot aide l'utilisateur à corriger son utilisation

## 📚 Utilisation

### Pour les développeurs de commandes

#### Structure minimale d'une commande

```javascript
module.exports = {
    name: 'macommande',
    description: 'Description courte',
    usage: '+macommande [arguments]',
    permissions: ['ManageRoles'], // Optionnel
    botPermissions: ['EmbedLinks'], // Optionnel
    cooldown: 5, // Optionnel, défaut: 3s
    aliases: ['alias1'], // Optionnel
    
    async execute(message, args, client) {
        // Votre logique ici
    }
};
```

#### Utiliser les embeds d'erreur

```javascript
const embeds = require('../../utils/embeds');

// Arguments manquants
return message.reply({ 
    embeds: [embeds.missingArgs('+ban @user [raison]', 'Bannir un utilisateur du serveur')] 
});

// Permissions manquantes
return message.reply({ 
    embeds: [embeds.missingPermissions(['BanMembers', 'ManageGuild'])] 
});

// Erreur personnalisée
return message.reply({ 
    embeds: [embeds.error('Cet utilisateur est déjà banni.')] 
});
```

### Types d'embeds disponibles

#### ✅ Succès
```javascript
embeds.success('Description', 'Titre optionnel', { fields: [...] })
```

#### ❌ Erreur
```javascript
embeds.error('Description', 'Titre optionnel', { fields: [...] })
```

#### ❌ Arguments manquants
```javascript
embeds.missingArgs('+ban @user [raison]', 'Bannir un utilisateur')
```

#### 🔐 Permissions manquantes
```javascript
embeds.missingPermissions(['BanMembers', 'ManageGuild'])
```

#### ⏱️ Cooldown
```javascript
embeds.cooldown(5) // Affiche "Attendez 5s"
```

#### ⚠️ Avertissement
```javascript
embeds.warn('Description', 'Titre optionnel')
```

#### ℹ️ Information
```javascript
embeds.info('Description', 'Titre optionnel')
```

#### 🛡️ Modération
```javascript
embeds.moderation('Description', 'Titre optionnel')
```

#### 🔒 Sécurité
```javascript
embeds.security('Description', 'Titre optionnel')
```

## 🔧 Système de validation automatique

Le `messageCreate.js` valide automatiquement :

1. **Commande existe** - Sinon: silence
2. **Permissions utilisateur** - Sinon: embed permissions manquantes
3. **Permissions du bot** - Sinon: embed permissions insuffisantes
4. **Cooldown** - Sinon: embed cooldown
5. **Exécution** - Sinon: embed d'erreur d'exécution

## 📝 Exemple complet

```javascript
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'warn',
    description: 'Donner un avertissement à un utilisateur',
    usage: '+warn <@utilisateur> [raison]',
    category: 'moderation',
    permissions: ['ModerateMembers'],
    botPermissions: ['ManageRoles'],
    cooldown: 3,
    
    async execute(message, args, client) {
        // Vérifier les arguments
        if (args.length === 0) {
            return message.reply({
                embeds: [embeds.missingArgs('+warn <@utilisateur> [raison]', 'Donner un avertissement')]
            });
        }
        
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply({
                embeds: [embeds.error('Veuillez mentionner un utilisateur.', '❌ Utilisateur non trouvé')]
            });
        }
        
        const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';
        
        try {
            // Logique du warn
            await message.reply({
                embeds: [embeds.success(`${user.tag} a reçu un avertissement.`, '✅ Avertissement appliqué', {
                    fields: [
                        { name: 'Raison', value: reason },
                        { name: 'Modérateur', value: message.author.tag }
                    ]
                })]
            });
        } catch (error) {
            client.logger.error('Erreur warn:', error);
            return message.reply({
                embeds: [embeds.error('Une erreur est survenue lors du warn.')]
            });
        }
    }
};
```

## 📊 Améliorations apportées

| Avant | Après |
|-------|-------|
| Message texte simple | Embed coloré avec détails |
| Pas d'aide sur l'utilisation | Affiche usage + exemples |
| Réponse à TOUTES les tentatives | Répond UNIQUEMENT aux commandes valides |
| Pas de distinction d'erreur | Types d'erreur clairement identifiés |
| Footer générique | Footer cohérent "Haruka Protect ⚡" |

## 🎨 Palette de couleurs

- 🟢 **Succès**: `#00FF00` (Vert)
- 🔴 **Erreur**: `#FF0000` (Rouge)
- 🟠 **Avertissement**: `#FFA500` (Orange)
- 🔵 **Information**: `#0099FF` (Bleu)
- 🟣 **Modération**: `#FF69B4` (Rose)
- 🟣 **Sécurité**: `#8B00FF` (Violet)

## 🔒 Sécurité

✅ Protection contre le spam de commandes invalides  
✅ Validation stricte des permissions  
✅ Gestion d'erreurs robuste  
✅ Logging de toutes les actions  

---

**Dernière mise à jour**: 17 novembre 2025  
**Version**: 2.0  
**Status**: ✅ Production-ready
