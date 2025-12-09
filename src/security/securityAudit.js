const fs = require('fs').promises;
const fsSync = require('fs');
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
        await this.generateReport();
        return { vulnerabilities: this.vulnerabilities.length, warnings: this.warnings.length, passed: this.passed.length, safe: this.vulnerabilities.length === 0 };
    }

    async checkEnvironmentVariables() {
        logger.info('Vérification des variables d\'environnement...');
        const required = ['TOKEN', 'OWNER_ID'];
        const missing = required.filter(k => !process.env[k]);
        if (missing.length > 0) {
            this.vulnerabilities.push({ type: 'CRITICAL', category: 'Environment', message: `Variables manquantes : ${missing.join(', ')}`, fix: 'Définir les variables dans .env ou l\'hôte' });
        } else {
            this.passed.push('Variables d\'environnement requises présentes');
        }
    }

    async getAllFiles(dir, exts = ['.js', '.ts', '.py', '.json']) {
        let results = [];
        try {
            await fs.access(dir);
        } catch {
            return results;
        }

        const list = await fs.readdir(dir);
        for (const file of list) {
            const fp = path.join(dir, file);
            const stat = await fs.stat(fp);
            if (stat.isDirectory()) {
                if (file === 'node_modules' || file === '.git') continue;
                results = results.concat(await this.getAllFiles(fp, exts));
            } else {
                if (exts.includes(path.extname(fp))) results.push(fp);
            }
        }
        return results;
    }

    async scanForHardcodedSecrets() {
        logger.info('Recherche de secrets codés en dur...');
        const patterns = [
            /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g,
            /api[_-]?key["']?\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}/gi,
            /token["']?\s*[:=]\s*["'][A-Za-z0-9_\-]{8,}/gi,
            /mongodb:\/\//gi,
            /AKIA[0-9A-Z]{16}/g
        ];
        const files = await this.getAllFiles(path.join(process.cwd(), 'src'));
        
        await Promise.all(files.map(async (f) => {
            try {
                const content = await fs.readFile(f, 'utf8');
                for (const p of patterns) {
                    p.lastIndex = 0;
                    if (p.test(content)) {
                        this.vulnerabilities.push({ 
                            type: 'CRITICAL', 
                            category: 'Hardcoded Secrets', 
                            message: `Secret pattern in ${path.relative(process.cwd(), f)}`, 
                            fix: 'Remove secrets and use environment variables' 
                        });
                    }
                }
            } catch (e) {
                logger.error('Error reading file during secret scan', e);
            }
        }));
        
        if (!this.vulnerabilities.some(v => v.category === 'Hardcoded Secrets')) {
            this.passed.push('No hardcoded secrets detected');
        }
    }

    async checkPermissions() {
        logger.info('Vérification de .gitignore et .env...');
        const envPath = path.join(process.cwd(), '.env');
        
        try {
            await fs.access(envPath);
            this.warnings.push({ type: 'WARNING', category: 'File Permissions', message: '.env exists in repository root', fix: 'Ensure .env is not committed to git and rotate secrets if it was' });
        } catch {}

        const gi = path.join(process.cwd(), '.gitignore');
        try {
            const c = await fs.readFile(gi, 'utf8');
            if (!c.includes('.env')) {
                this.vulnerabilities.push({ type: 'CRITICAL', category: 'Git Security', message: '.env not present in .gitignore', fix: 'Add .env to .gitignore' });
            } else {
                this.passed.push('.env present in .gitignore');
            }
        } catch {
            this.warnings.push({ type: 'WARNING', category: 'Git', message: '.gitignore not found', fix: 'Create a .gitignore' });
        }
    }

    async checkDependencies() {
        logger.info('Vérification de package.json pour la version discord.js et node');
        const pkg = path.join(process.cwd(), 'package.json');
        
        try {
            const content = await fs.readFile(pkg, 'utf8');
            const pj = JSON.parse(content);
            const deps = { ...pj.dependencies, ...pj.devDependencies };
            if (deps['discord.js']) {
                const v = deps['discord.js'].replace(/[^0-9.]/g, '');
                const major = parseInt(v.split('.')[0]);
                if (major < 14) {
                    this.warnings.push({ type: 'WARNING', category: 'Dependencies', message: `discord.js v${v} detected - recommend v14+`, fix: 'Update discord.js to v14+' });
                } else {
                    this.passed.push('discord.js v14+ or compatible');
                }
            }
        } catch (e) {
            this.warnings.push({ type: 'WARNING', category: 'Dependencies', message: 'package.json not found or invalid', fix: 'Create package.json' });
        }
    }

    async validateFileStructure() {
        logger.info('Validation de la structure du projet...');
        const required = ['src/commands', 'src/events', 'src/handlers', 'src/utils', 'src/core', 'src/security'];
        
        await Promise.all(required.map(async (r) => {
            try {
                await fs.access(path.join(process.cwd(), r));
                this.passed.push(`Found ${r}`);
            } catch {
                this.warnings.push({ type: 'WARNING', category: 'Structure', message: `Missing directory: ${r}`, fix: `Create ${r}` });
            }
        }));
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            vulnerabilities: this.vulnerabilities,
            warnings: this.warnings,
            passed: this.passed
        };
        const logsDir = path.join(process.cwd(), 'logs');
        
        try {
            await fs.mkdir(logsDir, { recursive: true });
            await fs.writeFile(path.join(logsDir, 'security.log'), JSON.stringify(report, null, 2), 'utf8');
        } catch (e) {
            logger.error('Error writing security report', e);
        }
        
        logger.info(`Audit de sécurité terminé : ${this.vulnerabilities.length} vulnérabilités, ${this.warnings.length} avertissements`);
    }
}

module.exports = SecurityAudit;
