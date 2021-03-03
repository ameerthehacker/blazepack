const path = require('path');
const fs = require('fs');
const ini = require('ini');
const npmConf = require('npm-conf')();
const matchAll = require('match-all');

const GLOBAL_CONFIG = npmConf.get('globalconfig');
const USER_CONFIG = npmConf.get('userconfig');

function parseNpmrc(directory) {
  const PROJECT_CONFIG = path.join(directory, '.npmrc');

  if (fs.existsSync(PROJECT_CONFIG)) {
    const npmrc = fs.readFileSync(PROJECT_CONFIG, 'utf-8');

    return ini.parse(npmrc);
  } else if (fs.existsSync(USER_CONFIG)) {
    const npmrc = fs.readFileSync(USER_CONFIG, 'utf-8');

    return ini.parse(npmrc);
  } else if (fs.existsSync(GLOBAL_CONFIG)) {
    const npmrc = fs.readFileSync(GLOBAL_CONFIG, 'utf-8');

    return ini.parse(npmrc);
  }
}

function getRegistries(directory) {
  const npmrc = parseNpmrc(directory);
  const registries = [];

  for(const config in npmrc) {
    if ((/@(.*):registry/gi).test(config)) {
      const scope = matchAll(config, /@(.*):registry/gi).toArray()[0];

      registries.push({
        scope,
        registry: npmrc[config]
      });
    } else if (config === 'registry') {
      registries.push({
        scope: '',
        registry: npmrc[config]
      });
    } else if ((/\/\/(.*)\/:(_authToken|_auth)/gi).test(config)) {
      const registry = matchAll(config,  /\/\/(.*)\/:(_authToken|_auth)/gi).toArray()[0];
      const registryConfig = registries.find(config => {
        const registryURL = new URL(config.registry);

        return registryURL.host === registry;
      });

      if (registryConfig) {
        registryConfig.token = npmrc[config];
      }
    }
  }

  return registries;
}

module.exports = {
  getRegistries
};
