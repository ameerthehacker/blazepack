const npm = require('../../npm');
const fs = require('fs');
const { logError, logSuccess, getPackageJSON } = require('../../utils');

async function installPackage(package, dev) {
  try {
    let packageName, version;

    // package name has scope
    if (package.startsWith('@')) {
      [, packageName, version] = package.split('@');

      // add back the @
      packageName = `@${packageName}`;
    } else {
      [packageName, version] = package.split('@');
    }

    const potentialJSON = getPackageJSON();

    if (potentialJSON) {
      const { json: packageJSON, indent, file } = potentialJSON;
      const latestVersion = await npm.getLatestVersion(packageName);
      const packageVersion = version || latestVersion;
      if(dev == undefined){
      if (packageJSON.dependencies) {
        packageJSON.dependencies = {
          ...packageJSON.dependencies,
          [packageName]: `^${packageVersion}`,
        };
      }
    }else{
      if (packageJSON.devDependencies) {
        packageJSON.devDependencies = {
          ...packageJSON.devDependencies,
          [packageName]: `^${packageVersion}`,
        };
      }
    }

      fs.writeFileSync(file, JSON.stringify(packageJSON, null, indent));

      logSuccess(`Installed ${dev ? 'dev package' : 'package'} ${packageName}@${packageVersion}`);
    } else {
      logError('Unable to find package.json for the project');
    }
  } catch (err) {
    if (err.name === 'PackageNotFoundError') {
      logError(`Unable to find package ${package} in the npm registry`);
    } else {
      logError(`Unable to install package ${package}: ${err.error}`);
    }
  }
}

module.exports = installPackage;
