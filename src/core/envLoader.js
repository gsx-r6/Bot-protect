const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

function loadEnvironment() {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        logger.info('Environment loaded from .env');
    } else {
        // Load from system env (hosted)
        dotenv.config();
        logger.info('.env not found - using process.env');
    }

    // Basic validation - fail fast if critical vars missing
    const required = ['TOKEN', 'OWNER_ID'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
        logger.error(`❌ CRITICAL: Missing required env vars: ${missing.join(', ')}`);
        logger.error('Configure these in Replit Secrets before starting the bot.');
        process.exit(1);
    }
    logger.success('✅ All required environment variables loaded');
}

module.exports = { loadEnvironment };
