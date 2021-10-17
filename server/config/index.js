const nconf = require('nconf');
const yaml = require('nconf-yaml');

nconf.formats.yaml = yaml;

const fs = require('fs');
const path = require('path');

const environment = process.env.NODE_ENV || 'development';

const baseConfigPath = path.join(__dirname, 'config.yaml');
const envConfigPath = path.join(__dirname, `config.${environment}.yaml`);
const localConfigPath = path.join(__dirname, `config.${environment}.local.yaml`);

const hasBaseConfig = fs.existsSync(baseConfigPath);
const hasEnvConfig = fs.existsSync(envConfigPath);
const hasLocalConfig = fs.existsSync(localConfigPath);

if (!hasBaseConfig && !hasEnvConfig) {
    throw new Error(`Could not find "${envConfigPath} or ${baseConfigPath}".`);
}

nconf.argv();

if (hasLocalConfig) {
    nconf.file('local', {
        file: `config.${environment}.local.yaml`,
        dir:__dirname,
        format: yaml,
        search: true,
    });
}

if (hasEnvConfig) {
    nconf.file('environment', {
        file: `config.${environment}.yaml`,
        dir:__dirname,
        format: yaml,
        search: true,
    });
}

if (hasBaseConfig) {
    nconf.file('base', {
        file: 'config.yaml',
        dir:__dirname,
        format: yaml,
        search: true,
    });
}

module.exports = nconf;
