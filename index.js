/**
 * 🚀 ENTRY POINT - Bot-Protect
 * 
 * Ce fichier est le point d'entrée pour les hébergeurs (Wispbyte, Replit, etc.)
 * Il importe simplement le vrai fichier du bot situé dans src/core/index.js
 * 
 * Ne pas modifier ce fichier !
 */

// Charger les variables d'environnement depuis .env
require('dotenv').config();

// Importer et démarrer le bot
require('./src/core/index.js');
