const fs = require('fs');
const path = require('path');

function collectAndWriteFiles(mappingTemplates, baseCoverageDir) {
  const baseDir = path.resolve(process.cwd(), baseCoverageDir);
  const baseTempleteDir = path.join(baseDir, 'templates');

  const consolidatedCoverage = {};
  mappingTemplates.forEach((templateMap, key) => {
    if (!templateMap.compiler._coveragePosCalculated) {
      templateMap.compiler.calculateCoveragePositions(templateMap.compiler.asts);
    }

    const fileName = path.join(baseTempleteDir, key);
    consolidatedCoverage[key] = {
      path: fileName,
      branchMap: {},
      fnMap: {},
      b: {},
      f: {},
      l: {},
      s: {},
      statementMap: {},
      ...(templateMap.compiler.coverages || {})
    }
    fs.writeFileSync(fileName, templateMap.template.content);
  });
  fs.writeFileSync(path.join(baseDir, 'coverage.json'), JSON.stringify(consolidatedCoverage));
}

module.exports = {
  collectAndWriteFiles
}