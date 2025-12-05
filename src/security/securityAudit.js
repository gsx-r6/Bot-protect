const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class SecurityAudit {
    constructor() {
        this.vulnerabilities = [];
        this.warnings = [];
        this.passed = [];
    }

    async runFullAudit() {
        logger.info('🔒 Lancement de l\'audit de sécurité...');
        await this.checkEnvironmentVariables();
        await this.scanForHardcodedSecrets();
        await this.checkPermissions();
        await this.checkDependencies();
        await this.validateFileStructure();
        this.generateReport();
        return { vulnerabilities: this.vulnerabilities.length, warnings: this.warnings.length, passed: this.passed.length, safe: this.vulnerabilities.length === 0 };
    }

    async checkEnvironmentVariables() {
        logger.info('Vérification des variables d\'environnement...');
        const required = ['TOKEN', 'OWNER_ID'];
        const missing = required.filter(k => !process.env[k]);
        if (missing.length > 0) this.vulnerabilities.push({ type: 'CRITICAL', category: 'Environment', message: `Variables manquantes : ${missing.join(', ')}`, fix: 'Définir les variables dans .env ou l\'hôte' });
        else this.passed.push('Variables d\'environnement requises présentes');
    }

    getAllFiles(dir, exts = ['.js', '.ts', '.py', '.json']) {
        let results = [];
        if (!fs.existsSync(dir)) return results;
        const list = fs.readdirSync(dir);
        for (const file of list) {
            const fp = path.join(dir, file);
            const stat = fs.statSync(fp);
            if (stat.isDirectory()) {
                if (file === 'node_modules' || file === '.git') continue;
                results = results.concat(this.getAllFiles(fp, exts));
            } else {
                if (exts.includes(path.extname(fp))) results.push(fp);
            }
        }
        return results;
    }

    async scanForHardcodedSecrets() {
        logger.info('Recherche de secrets codés en dur...');
        const patterns = [/[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g, /api[_-]?key["']?\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}/gi, /token["']?\s*[:=]\s*["'][A-Za-z0-9_\-]{8,}/gi, /mongodb:\/\//gi, /AKIA[0-9A-Z]{16}/g];
        const files = this.getAllFiles(path.join(process.cwd(), 'src'));
        for (const f of files) {
            try {
                const content = fs.readFileSync(f, 'utf8');
                for (const p of patterns) {
                    if (p.test(content)) {
                        this.vulnerabilities.push({ type: 'CRITICAL', category: 'Hardcoded Secrets', message: `Secret pattern in ${path.relative(process.cwd(), f)}`, fix: 'Remove secrets and use environment variables' });
                    }
                }
            } catch (e) {
                logger.error('Error reading file during secret scan', e);
            }
        }
        if (!this.vulnerabilities.some(v => v.category === 'Hardcoded Secrets')) this.passed.push('No hardcoded secrets detected in bot_mix');
    }

    async checkPermissions() {
        logger.info('Vérification de .gitignore et .env...');
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) this.warnings.push({ type: 'WARNING', category: 'File Permissions', message: '.env exists in repository root', fix: 'Ensure .env is not committed to git and rotate secrets if it was' });
        const gi = path.join(process.cwd(), '.gitignore');
        if (fs.existsSync(gi)) {
            const c = fs.readFileSync(gi, 'utf8');
            if (!c.includes('.env')) this.vulnerabilities.push({ type: 'CRITICAL', category: 'Git Security', message: '.env not present in .gitignore', fix: 'Add .env to .gitignore' });
            else this.passed.push('.env present in .gitignore');
        } else {
            this.warnings.push({ type: 'WARNING', category: 'Git', message: '.gitignore not found', fix: 'Create a .gitignore' });
        }
    }

    async checkDependencies() {
        logger.info('Vérification de package.json pour la version discord.js et node');
        const pkg = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(pkg)) { this.warnings.push({ type: 'WARNING', category: 'Dependencies', message: 'package.json not found', fix: 'Create package.json' }); return; }
        try {
            const pj = JSON.parse(fs.readFileSync(pkg, 'utf8'));
            const deps = { ...pj.dependencies, ...pj.devDependencies };
            if (deps['discord.js']) {
                const v = deps['discord.js'].replace(/[^0-9.]/g, '');
                const major = parseInt(v.split('.')[0]);
                if (major < 14) this.warnings.push({ type: 'WARNING', category: 'Dependencies', message: `discord.js v${v} detected - recommend v14+`, fix: 'Update discord.js to v14+' });
                else this.passed.push('discord.js v14+ or compatible');
            }
        } catch (e) { logger.error('Error parsing package.json', e); }
    }

    async validateFileStructure() {
        logger.info('Validation de la structure du projet...');
        const required = ['src/commands', 'src/events', 'src/handlers', 'src/utils', 'src/core', 'src/security'];
        for (const r of required) {
            if (!fs.existsSync(path.join(process.cwd(), r))) this.warnings.push({ type: 'WARNING', category: 'Structure', message: `Missing directory: ${r}`, fix: `Create ${r}` });
            else this.passed.push(`Found ${r}`);
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            vulnerabilities: this.vulnerabilities,
            warnings: this.warnings,
            passed: this.passed
        };
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
        fs.writeFileSync(path.join(logsDir, 'security.log'), JSON.stringify(report, null, 2), 'utf8');
        logger.info(`Audit de sécurité terminé : ${this.vulnerabilities.length} vulnérabilités, ${this.warnings.length} avertissements`);
    }
}

module.exports = SecurityAudit;
