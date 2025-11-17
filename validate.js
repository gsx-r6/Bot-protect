#!/usr/bin/env node

/**
 * Script de Validation - Vérifier que la restructuration est complète
 * Exécution: node validate.js
 */

const fs = require('fs');
const path = require('path');

const checks = {
    success: [],
    warning: [],
    error: []
};

console.log('\n📋 VALIDATION DE LA RESTRUCTURATION\n');

// ==================== VÉRIFICATIONS ====================

// 1. Structure data/
console.log('1️⃣  Vérifiant structure data/...');
const dataDirs = ['logs', 'database', 'cache', 'backups'];
for (const dir of dataDirs) {
    const dirPath = path.join(process.cwd(), 'data', dir);
    if (fs.existsSync(dirPath)) {
        checks.success.push(`   ✅ data/${dir}/ existe`);
    } else {
        checks.error.push(`   ❌ data/${dir}/ manque`);
    }
}

// 2. Fichiers .gitkeep
console.log('\n2️⃣  Vérifiant .gitkeep...');
for (const dir of dataDirs) {
    const gitkeepPath = path.join(process.cwd(), 'data', dir, '.gitkeep');
    if (fs.existsSync(gitkeepPath)) {
        checks.success.push(`   ✅ data/${dir}/.gitkeep existe`);
    } else {
        checks.warning.push(`   ⚠️  data/${dir}/.gitkeep manque`);
    }
}

// 3. Logger.js
console.log('\n3️⃣  Vérifiant logger.js...');
const loggerPath = path.join(process.cwd(), 'src', 'utils', 'logger.js');
if (fs.existsSync(loggerPath)) {
    const loggerContent = fs.readFileSync(loggerPath, 'utf8');
    if (loggerContent.includes('class Logger')) {
        checks.success.push('   ✅ logger.js est la nouvelle version (classe Logger)');
    } else {
        checks.warning.push('   ⚠️  logger.js structure inconnue');
    }
    
    const methods = ['info', 'success', 'warn', 'error', 'debug', 'command'];
    for (const method of methods) {
        if (loggerContent.includes(`${method}(...args)`)) {
            checks.success.push(`   ✅ logger.${method}() défini`);
        } else {
            checks.warning.push(`   ⚠️  logger.${method}() manque`);
        }
    }
} else {
    checks.error.push('   ❌ logger.js introuvable');
}

// 4. Package.json
console.log('\n4️⃣  Vérifiant package.json...');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (pkg.dependencies && pkg.dependencies.chalk) {
        checks.success.push(`   ✅ chalk ${pkg.dependencies.chalk} dans dependencies`);
    } else {
        checks.error.push('   ❌ chalk manque dans dependencies');
    }
} else {
    checks.error.push('   ❌ package.json introuvable');
}

// 5. .gitignore
console.log('\n5️⃣  Vérifiant .gitignore...');
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    const patterns = [
        'data/logs/*.log',
        'data/database/*.db',
        '!data/logs/.gitkeep',
        '!data/database/.gitkeep'
    ];
    
    for (const pattern of patterns) {
        if (gitignore.includes(pattern)) {
            checks.success.push(`   ✅ ${pattern} ignoré`);
        } else {
            checks.warning.push(`   ⚠️  ${pattern} manque`);
        }
    }
} else {
    checks.error.push('   ❌ .gitignore introuvable');
}

// 6. Core index.js
console.log('\n6️⃣  Vérifiant core/index.js...');
const corePath = path.join(process.cwd(), 'src', 'core', 'index.js');
if (fs.existsSync(corePath)) {
    const coreContent = fs.readFileSync(corePath, 'utf8');
    if (coreContent.includes('logger.success') && coreContent.includes('getLogsSize')) {
        checks.success.push('   ✅ Tests de logs intégrés');
    } else {
        checks.warning.push('   ⚠️  Tests de logs manquent');
    }
} else {
    checks.warning.push('   ⚠️  core/index.js introuvable');
}

// 7. Rankpanel.js
console.log('\n7️⃣  Vérifiant rankpanel.js...');
const rankpanelPath = path.join(process.cwd(), 'src', 'commands', 'administration', 'rankpanel.js');
if (fs.existsSync(rankpanelPath)) {
    const rankpanelContent = fs.readFileSync(rankpanelPath, 'utf8');
    if (rankpanelContent.includes('getRoleOptionsForPage') && rankpanelContent.includes('rank_prev_page')) {
        checks.success.push('   ✅ Pagination implémentée');
    } else {
        checks.warning.push('   ⚠️  Pagination introuvable');
    }
} else {
    checks.warning.push('   ⚠️  rankpanel.js introuvable');
}

// 8. Documentation
console.log('\n8️⃣  Vérifiant documentation...');
const docs = ['MIGRATION_NOTES.md', 'LOGGER_GUIDE.md', 'README_CHECKLIST.md', 'RESUME_FINAL.md'];
for (const doc of docs) {
    const docPath = path.join(process.cwd(), doc);
    if (fs.existsSync(docPath)) {
        checks.success.push(`   ✅ ${doc} créé`);
    } else {
        checks.warning.push(`   ⚠️  ${doc} manque`);
    }
}

// ==================== RÉSUMÉ ====================

console.log('\n\n' + '═'.repeat(50));
console.log('RÉSUMÉ');
console.log('═'.repeat(50));

console.log(`\n✅ SUCCÈS (${checks.success.length}):`);
for (const msg of checks.success) {
    console.log(msg);
}

if (checks.warning.length > 0) {
    console.log(`\n⚠️  AVERTISSEMENTS (${checks.warning.length}):`);
    for (const msg of checks.warning) {
        console.log(msg);
    }
}

if (checks.error.length > 0) {
    console.log(`\n❌ ERREURS (${checks.error.length}):`);
    for (const msg of checks.error) {
        console.log(msg);
    }
}

console.log('\n' + '═'.repeat(50));

// Verdict
const hasErrors = checks.error.length > 0;
const hasWarnings = checks.warning.length > 0;

if (hasErrors) {
    console.log('\n🔴 VALIDATION ÉCHOUÉE - Erreurs détectées');
    process.exit(1);
} else if (hasWarnings) {
    console.log('\n🟡 VALIDATION PARTIELLE - Avertissements présents');
    process.exit(0);
} else {
    console.log('\n🟢 VALIDATION RÉUSSIE - Tout est en ordre!');
    console.log('\n✨ Vous pouvez lancer: npm install && npm start');
    process.exit(0);
}
