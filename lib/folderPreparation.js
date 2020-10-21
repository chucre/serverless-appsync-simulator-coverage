const fs = require('fs');
const path = require('path');

function prepareCoverageFolder(baseCoverageDir) {
  const baseDir = path.resolve(process.cwd(), baseCoverageDir);
  const baseTempleteDir = path.join(baseDir, 'templates');
  if (fs.existsSync(baseDir)){
    fs.rmdirSync(baseDir, {
      recursive: true
    })
  }
  fs.mkdirSync(baseDir);
  fs.mkdirSync(baseTempleteDir);
}

module.exports = {
  prepareCoverageFolder
}