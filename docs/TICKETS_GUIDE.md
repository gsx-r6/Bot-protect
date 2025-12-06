# 🎫 Guide du Système de Tickets - {+} uhq Monde

## 📋 Table des Matières
1. [Introduction](#introduction)
2. [Configuration Initiale](#configuration-initiale)
3. [Utilisation](#utilisation)
4. [Commandes Disponibles](#commandes-disponibles)
5. [Fonctionnalités Avancées](#fonctionnalités-avancées)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

Le système de tickets de **{+} uhq Monde** est un système professionnel et complet permettant de gérer efficacement les demandes de support de votre communauté.

### ✨ Fonctionnalités Principales

- 🎨 **Panel Personnalisable** : Titre, description, couleur, message de bienvenue
- 🔒 **Permissions Strictes** : Seuls le créateur et le staff peuvent voir le ticket
- ✋ **Système de Claim** : Les membres du staff peuvent prendre en charge les tickets
- 📝 **Transcripts Automatiques** : Sauvegarde automatique lors de la fermeture
- 📊 **Statistiques Détaillées** : Suivi complet de l'activité
- 🚫 **Limite par Utilisateur** : Évite le spam de tickets
- 👥 **Ajout de Membres** : Possibilité d'ajouter des personnes au ticket
- 📋 **Liste des Tickets** : Les utilisateurs peuvent voir leurs tickets ouverts

---

## Configuration Initiale

### Étape 1 : Créer une Catégorie

1. Créez une catégorie Discord pour les tickets (ex: "📩 TICKETS")
2. Notez l'ID de la catégorie (Clic droit > Copier l'identifiant)

### Étape 2 : Configurer le Rôle Staff

```
+ticketconfig staff @Staff
```

Ce rôle aura accès à tous les tickets et pourra les gérer.

### Étape 3 : Définir la Catégorie

```
+ticketconfig category ID_DE_LA_CATEGORIE
```

Tous les tickets seront créés dans cette catégorie.

### Étape 4 : Configurer les Logs

```
+ticketconfig logs #ticket-logs
```

Les événements (création, fermeture) seront loggés ici.

### Étape 5 : Personnaliser le Panel (Optionnel)

```bash
# Titre du panel
+ticketconfig title 🎫 Support Technique

# Description
+ticketconfig description Besoin d'aide ? Notre équipe est là pour vous !

# Couleur (format HEX)
+ticketconfig color #5865F2

# Message de bienvenue (variables disponibles: {user}, {username}, {server})
+ticketconfig message Bienvenue {user} ! Un membre du staff va vous assister rapidement.

# Limite de tickets par utilisateur
+ticketconfig limit 2

# Activer/désactiver les transcripts
+ticketconfig transcript
```

### Étape 6 : Publier le Panel

```
+ticket
```

Le panel sera publié dans le salon actuel.

---

## Utilisation

### Pour les Utilisateurs

#### Créer un Ticket

1. Cliquez sur le bouton **"Créer un ticket"** 📩
2. Remplissez le formulaire :
   - **Sujet** : Décrivez brièvement votre problème
   - **Description** : Expliquez en détail (optionnel)
3. Validez

Un salon privé sera créé automatiquement.

#### Voir ses Tickets

Cliquez sur le bouton **"Mes tickets"** 📋 pour voir la liste de vos tickets ouverts.

### Pour le Staff

#### Prendre en Charge un Ticket

Dans le ticket, cliquez sur **"Prendre en charge"** ✋

Le ticket sera marqué comme pris en charge et votre nom apparaîtra dans le topic.

#### Ajouter un Membre

1. Cliquez sur **"Ajouter membre"** ➕
2. Entrez l'ID Discord du membre
3. Validez

Le membre aura accès au ticket.

#### Générer un Transcript

Cliquez sur **"Transcript"** 📝 pour générer un fichier texte contenant l'historique du ticket.

#### Fermer un Ticket

1. Cliquez sur **"Fermer"** 🔒
2. Confirmez la fermeture

Le ticket sera automatiquement :
- Marqué comme fermé en base de données
- Transcript généré (si activé)
- Supprimé après 5 secondes

---

## Commandes Disponibles

### Configuration

| Commande | Description | Exemple |
|----------|-------------|---------|
| `+ticketconfig` | Afficher la configuration actuelle | `+ticketconfig` |
| `+ticketconfig staff @role` | Définir le rôle staff | `+ticketconfig staff @Support` |
| `+ticketconfig category <ID>` | Définir la catégorie | `+ticketconfig category 123456789` |
| `+ticketconfig logs #salon` | Définir le salon de logs | `+ticketconfig logs #logs` |
| `+ticketconfig limit <1-10>` | Limite de tickets par user | `+ticketconfig limit 2` |
| `+ticketconfig title <texte>` | Titre du panel | `+ticketconfig title Support` |
| `+ticketconfig description <texte>` | Description du panel | `+ticketconfig description Aide` |
| `+ticketconfig color #RRGGBB` | Couleur du panel | `+ticketconfig color #FF0000` |
| `+ticketconfig message <texte>` | Message de bienvenue | `+ticketconfig message Bonjour {user}` |
| `+ticketconfig transcript` | Toggle transcripts | `+ticketconfig transcript` |
| `+ticketconfig reset` | Réinitialiser la config | `+ticketconfig reset` |

### Gestion

| Commande | Description | Exemple |
|----------|-------------|---------|
| `+ticket` | Publier le panel de tickets | `+ticket` |
| `+ticketstats` | Statistiques détaillées | `+ticketstats` |

---

## Fonctionnalités Avancées

### Variables dans le Message de Bienvenue

Vous pouvez utiliser ces variables dans le message de bienvenue :

- `{user}` : Mention de l'utilisateur (@User)
- `{username}` : Nom d'utilisateur (User)
- `{server}` : Nom du serveur

**Exemple :**
```
+ticketconfig message Bienvenue {user} sur {server} ! Comment pouvons-nous vous aider ?
```

**Résultat :**
```
Bienvenue @User sur Mon Serveur ! Comment pouvons-nous vous aider ?
```

### Statistiques Avancées

La commande `+ticketstats` affiche :

- **Vue d'ensemble** : Total, ouverts, fermés, dernières 24h
- **Tickets ouverts** : Pris en charge, en attente, taux de prise en charge
- **Configuration** : Rôle staff, limite, transcripts
- **Top Créateurs** : Les 5 utilisateurs ayant créé le plus de tickets
- **Liste des tickets ouverts** : Si moins de 10 tickets

### Transcripts

Les transcripts sont générés automatiquement lors de la fermeture d'un ticket (si activés).

**Contenu du transcript :**
- Nom du serveur
- Nom du canal
- Créateur du ticket
- Membre ayant fermé le ticket
- Date de fermeture
- Historique complet des messages (jusqu'à 100 messages)
- Pièces jointes (URLs)

Le transcript est envoyé dans le salon de logs configuré.

### Permissions

Le système gère automatiquement les permissions :

**Créateur du ticket :**
- Voir le salon
- Envoyer des messages
- Lire l'historique
- Joindre des fichiers

**Rôle Staff :**
- Toutes les permissions ci-dessus
- Gérer les messages

**Autres membres :**
- Aucun accès (salon invisible)

---

## Troubleshooting

### Le panel ne s'affiche pas

**Vérifications :**
1. Le bot a-t-il la permission `SEND_MESSAGES` dans le salon ?
2. Le bot a-t-il la permission `EMBED_LINKS` ?

### Les tickets ne se créent pas

**Vérifications :**
1. La catégorie est-elle configurée ? (`+ticketconfig category`)
2. La catégorie existe-t-elle toujours ?
3. Le bot a-t-il la permission `MANAGE_CHANNELS` ?
4. La catégorie n'est-elle pas pleine ? (Max 50 salons par catégorie)

### Le rôle staff n'a pas accès

**Vérifications :**
1. Le rôle staff est-il configuré ? (`+ticketconfig staff`)
2. Le rôle existe-t-il toujours ?
3. Le bot est-il au-dessus du rôle staff dans la hiérarchie ?

### Les transcripts ne sont pas générés

**Vérifications :**
1. Les transcripts sont-ils activés ? (`+ticketconfig transcript`)
2. Le salon de logs est-il configuré ? (`+ticketconfig logs`)
3. Le bot a-t-il la permission `SEND_MESSAGES` dans le salon de logs ?
4. Le bot a-t-il la permission `ATTACH_FILES` ?

### L'utilisateur ne peut pas créer de ticket

**Causes possibles :**
1. L'utilisateur a atteint la limite de tickets ouverts
2. Vérifiez la limite : `+ticketconfig` (voir "Limite par user")
3. L'utilisateur doit fermer ses tickets existants avant d'en créer un nouveau

### Le bouton "Ajouter membre" ne fonctionne pas

**Vérifications :**
1. Seul le staff peut ajouter des membres
2. L'ID Discord est-il correct ?
3. Le membre est-il sur le serveur ?

---

## 🎯 Bonnes Pratiques

### Pour les Administrateurs

1. **Configurez un rôle staff dédié** : Ne donnez pas l'accès à tous les modérateurs
2. **Limitez les tickets par utilisateur** : 1-2 tickets maximum pour éviter le spam
3. **Activez les transcripts** : Utile pour l'historique et les preuves
4. **Créez un salon de logs** : Suivez l'activité des tickets
5. **Personnalisez le panel** : Utilisez les couleurs de votre serveur

### Pour le Staff

1. **Prenez en charge les tickets** : Utilisez le bouton "Prendre en charge"
2. **Soyez réactif** : Répondez rapidement aux tickets
3. **Générez un transcript** : Avant de fermer un ticket important
4. **Fermez les tickets résolus** : Ne laissez pas traîner les tickets

### Pour les Utilisateurs

1. **Soyez clair** : Décrivez précisément votre problème
2. **Un ticket = Un problème** : Ne mélangez pas plusieurs sujets
3. **Soyez patient** : Le staff répondra dès que possible
4. **Fermez vos tickets** : Une fois le problème résolu

---

## 📊 Exemple de Configuration Complète

```bash
# Configuration de base
+ticketconfig staff @Support
+ticketconfig category 123456789012345678
+ticketconfig logs #ticket-logs
+ticketconfig limit 2

# Personnalisation
+ticketconfig title 🎫 Support uhq Monde
+ticketconfig description Besoin d'aide ? Cliquez ci-dessous pour créer un ticket et notre équipe vous assistera rapidement !
+ticketconfig color #FF69B4
+ticketconfig message Bienvenue {user} ! 👋\n\nMerci d'avoir créé un ticket. Un membre de notre équipe va vous répondre sous peu.\n\nEn attendant, décrivez votre problème en détail pour que nous puissions vous aider au mieux !

# Activer les transcripts
+ticketconfig transcript

# Publier le panel
+ticket
```

---

## 🔧 Support

Si vous rencontrez un problème avec le système de tickets :

1. Vérifiez ce guide
2. Consultez `+ticketconfig` pour voir la configuration
3. Vérifiez les permissions du bot
4. Contactez le développeur du bot

---

**✨ Système de Tickets v2.0 - {+} uhq Monde**

*Dernière mise à jour : Décembre 2024*
