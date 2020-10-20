'use strict';
const fs = require('fs');
const path = require('path');

class ServerlessAppSyncSimulatorCoverage {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'before:offline:start:init': this.prepareInjects.bind(this),
      'before:offline:start:end': this.collectCoverage.bind(this)
    };
  }

  prepareInjects() {
    this.serverless.cli.log('Prepare injects');
    const simulator = this.getSimulator();
    if (!simulator) {
      return this.serverless.cli.log('Appsyn Simulator not found');
    }
    const compiler = simulator.mappingTemplates.values().next().value.compiler;
    const velocityPrototype = Object.getPrototypeOf(compiler);
    /*
    getReferences
    setValue
    getMacro// maybe counted twice
    getBlock //only the first
    //handle break cases
    //handle raw and strings cases
    */
    ['getReferences', 'setValue', 'getMacro', 'getBlock'].forEach(fnName => {
      velocityPrototype['_old_'+fnName] = velocityPrototype[fnName];
      velocityPrototype[fnName] = function() {
        try {
          this.countCoverage(arguments[0]);
        } catch(_) {
        }
        return this['_old_'+fnName].apply(this, arguments);
      }
    });
    Object.assign(velocityPrototype, {
      countCoverage: function(ast) {
        if (Array.isArray(ast)) {
          ast = ast[0];
        }
        if (!this._coveragePosCalculated) {
          this.calculateCoveragePositions(this.asts);
        }
        if (ast.coveragePos) {
          this.coverages.s[ast.coveragePos]++;
        }
      },
      calculateCoveragePositions: function(asts, currentLine, currentColumn) {
        this.coverages = this.coverages || {
          s: {},
          statementMap: {}
        }
        this.coveragesStatmentCount = this.coveragesStatmentCount || 0;

        currentLine = currentLine !== undefined ? currentLine : 1;
        currentColumn = currentColumn !== undefined ? currentColumn : 0;
        for(let i = 0; i < asts.length; i++) {
          let ast = asts[i];

          if (Array.isArray(ast)) {
            [currentLine, currentColumn] = this.calculateCoveragePositions(ast, currentLine, currentColumn);
            continue;
          }

          this.coveragesStatmentCount++;
          let start, end;
          if (typeof ast === 'string') {
            ast = {
              type: 'raw',
              value: ast
            }
            asts[i] = ast;
          }
          ast.coveragePos = this.coveragesStatmentCount;
          if (ast.pos) {
            start = {
              line: ast.pos.first_line,
              column: ast.pos.first_column
            }
            end = {
              line: ast.pos.last_line,
              column: ast.pos.last_column
            }
          } else {
            const lines = ast.value.split("\n");
            start = {
              line: currentLine,
              column: currentColumn + 1
            }
            end = {
              line: currentLine + lines.length - 1,
              column: currentColumn + lines[lines.length-1].length
            }
          }
          currentColumn = end.column;
          currentLine = end.line;
          this.coverages.s[this.coveragesStatmentCount] = 0;
          this.coverages.statementMap[this.coveragesStatmentCount] = {
            start,
            end
          }
        }
        this._coveragePosCalculated = true;
        return [currentLine, currentColumn];
      }
    })

  }

  collectCoverage() {
    try {
      this.serverless.cli.log('Collecting coverage');
      const simulator = this.getSimulator();
      if (!simulator) {
        return this.serverless.cli.log('Appsync Simulator not found');
      }
      const baseCoverageDir = 'coverage';
      const baseDir = path.resolve(process.cwd(), baseCoverageDir);
      const baseTempleteDir = path.join(baseDir, 'templates');
      if (!fs.existsSync(baseDir)){
        fs.mkdirSync(baseDir);
      }
      if (!fs.existsSync(baseTempleteDir)){
        fs.mkdirSync(baseTempleteDir);
      }

      const consolidatedCoverage = {};
      simulator.mappingTemplates.forEach((templateMap, key) => {
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
      console.log(consolidatedCoverage);
      fs.writeFileSync(path.join(baseDir, 'coverage.json'), JSON.stringify(consolidatedCoverage));
    } catch (e) {
      console.error(e);
    }
  }

  getSimulator() {
    return this.serverless.pluginManager.plugins
      .filter(_ => !!_.simulator && !!_.simulator._appSyncConfig)
      .map(_ => _.simulator)[0];
  }

}

module.exports = ServerlessAppSyncSimulatorCoverage;
