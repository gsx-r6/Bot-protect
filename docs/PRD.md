# PRD : Bot-Protect (Retro-documentation)

> Ce document est une rétro-ingénierie du bot existant "uhq-monde".

## 1. Objectif du Produit
Fournir un bot Discord de modération et de protection "UHQ" (Ultra High Quality) capable de sécuriser des serveurs contre les raids, les nukeurs et les actions malveillantes, tout en offrant des outils de modération classiques et un système de tickets complet.

## 2. Fonctionnalités Clés
- **Protection Avancée** : Anti-Raid, Anti-Spam, Protection des Rôles et Canaux. **Résilience Maximale** : Persistance des snapshots et états de raid en base de données pour une sécurité ininterrompue après redémarrage.
- **Modération Consolidée** : Ban, Kick, Mute, Timeout (bloque tout), Warns. Interface simplifiée (`+clear` intégrant purge).
- **Vérification UHQ** : Système de validation bouton avec détection anti-bypass (quarantaine) et logging sécurisé.
- **Logging Centralisé** : Configuration unique via menu interactif (`+setlogger`). Journalisation granulaire (vocal, messages, modération, sécurité).
- **Backups Unifiés** : Gestion complète des sauvegardes via une commande unique (`+backup <create|list|load>`).
- **Tickets** : Système de support intégré avec transcrits et gestion des permissions staff.
- **Gestion des Permissions** : Système hiérarchique propriétaire (`rank_permissions`) et protection contre les modifications de rôles non autorisées.

## 3. Utilisateurs Cibles
- Propriétaires de serveurs Discord communautaires.
- Équipes de modération.
