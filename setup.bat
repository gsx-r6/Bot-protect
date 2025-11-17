@echo off
REM Installation et Démarrage - Script Windows
REM Exécution: setup.bat

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  INSTALLATION BOT-PROTECT - RESTRUCTURATION COMPLÈTE  ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Vérifier Node.js
echo 1️⃣  Vérification Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé. Installez Node.js 18+ depuis nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% trouvé

REM Vérifier npm
echo.
echo 2️⃣  Vérification npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm n'est pas installé
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% trouvé

REM Vérifier/Créer structure data/
echo.
echo 3️⃣  Vérification structure data/...

if not exist "data\logs" (
    echo ⚠️  data\logs\ manque - création...
    mkdir data\logs
) else (
    echo ✅ data\logs\ existe
)

if not exist "data\database" (
    echo ⚠️  data\database\ manque - création...
    mkdir data\database
) else (
    echo ✅ data\database\ existe
)

if not exist "data\cache" (
    echo ⚠️  data\cache\ manque - création...
    mkdir data\cache
) else (
    echo ✅ data\cache\ existe
)

if not exist "data\backups" (
    echo ⚠️  data\backups\ manque - création...
    mkdir data\backups
) else (
    echo ✅ data\backups\ existe
)

REM Créer .gitkeep
type nul > data\logs\.gitkeep
type nul > data\database\.gitkeep
type nul > data\cache\.gitkeep
type nul > data\backups\.gitkeep
echo ✅ Fichiers .gitkeep créés

REM Installation dépendances
echo.
echo 4️⃣  Installation des dépendances...
call npm install
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)
echo ✅ Dépendances installées

REM Validation
echo.
echo 5️⃣  Validation de la structure...
node validate.js

if errorlevel 1 (
    echo.
    echo ❌ Validation échouée - Erreurs détectées
    pause
    exit /b 1
) else (
    echo.
    echo ╔════════════════════════════════════════════════════════╗
    echo ║              ✅ SETUP RÉUSSI - BOT PRÊT !             ║
    echo ╚════════════════════════════════════════════════════════╝
    echo.
    echo 🚀 Pour démarrer le bot:
    echo    npm start
    echo.
    echo 📚 Pour lire la documentation:
    echo    type QUICK_START.md
    echo.
    echo 🧪 Pour vérifier la structure:
    echo    dir data
    echo.
    pause
)
