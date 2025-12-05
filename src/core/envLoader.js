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

    // Basic validation
    const required = ['TOKEN', 'OWNER_ID'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
        logger.warn(`Missing required env vars: ${missing.join(', ')}`);
    }
}

module.exports = { loadEnvironment };
