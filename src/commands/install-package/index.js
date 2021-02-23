const getLatestPackageVersion = require('latest-version');
const fs = require('fs');
const { logError, logSuccess, getPackageJSON } = require('../../utils');

async function installPackage(package) {
  try {
    const [packageName, version] = package.split('@');
     const potentialJSON = getPackageJSON();

     if (potentialJSON) {
       const { json: packageJSON, indent, file } = potentialJSON;
       const latestVersion = await getLatestPackageVersion(packageName);
       const packageVersion = version || latestVersion;

       if (packageJSON.dependencies) {
         packageJSON.dependencies = {
           ...packageJSON.dependencies,
           [packageName]: `^${packageVersion}`,
         };
       }

       fs.writeFileSync(
         file, JSON.stringify(packageJSON, null, indent)
       );

      logSuccess(`Installed package ${packageName}@${packageVersion}`);
     } else {
      logError('Unable to find package.json for the project');
    }
  } catch(err) {
    if (err.name === 'PackageNotFoundError')  {
      logError(`Unable to find package ${package} in the npm registry`);
    } else {
      logError(`Unable to install package ${package}: ${err}`);
    }
  }
}

module.exports = installPackage;
