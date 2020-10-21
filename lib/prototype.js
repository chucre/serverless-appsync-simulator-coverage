/*
    getReferences
    setValue
    getMacro// maybe counted twice
    getBlock //only the first
    //handle break cases
    //handle raw and strings cases
    */

function injectPrototype(velocityPrototype) {
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
      if (ast.coveragesBranchPos) {
        this.coverages.b[ast.coveragesBranchPos][ast.coverageInternalBranchPos]++;
      }
    },
    calculateCoveragePositions: function(asts, currentLine, currentColumn) {
      this.coverages = this.coverages || {
        s: {},
        statementMap: {},
        b: {},
        branchMap: {}
      }
      this.coveragesStatmentCount = this.coveragesStatmentCount || 0;
      this.coveragesLinesCount = this.coveragesLinesCount || 0;
      this.coveragesBranchCount = this.coveragesBranchCount || 0;

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
            value: ast,
          }
          asts[i] = ast;
        }
        if (!ast.pos) {
          const lines = ast.value.split("\n");
          ast.pos = {
            first_line: currentLine,
            first_column: currentColumn + 1,
            last_line: currentLine + lines.length - 1,
            last_column: currentColumn + lines[lines.length-1].length
          }
        }
        ast.coveragePos = this.coveragesStatmentCount;
        start = {
          line: ast.pos.first_line,
          column: ast.pos.first_column
        }
        end = {
          line: ast.pos.last_line,
          column: ast.pos.last_column
        }
        currentColumn = end.column;
        currentLine = end.line;
        this.coverages.s[this.coveragesStatmentCount] = 0;
        this.coverages.statementMap[this.coveragesStatmentCount] = {
          start,
          end
        }
        switch (ast.type) {
          case 'if':
            this.coveragesBranchCount++;
            this.coverages.b[this.coveragesBranchCount] = [0, 0];
            ast.coveragesBranchPos = this.coveragesBranchCount;
            ast.coverageInternalBranchPos = 0;
            this.coverages.branchMap[this.coveragesBranchCount] = {
              type: 'if',
              locations: [
                {
                  start, end
                },
                {
                  start, end
                }
              ],
              casesCount: 1
            }
            break;
          case 'else':
            // throw new Error('Ast else case.');
            ast.coveragesBranchPos = this.coveragesBranchCount;
            ast.coverageInternalBranchPos = this.coverages.branchMap[this.coveragesBranchCount].casesCount++;
            this.coverages.branchMap[this.coveragesBranchCount].locations[ast.coverageInternalBranchPos] = {
              start, end
            };
          default:
            break;
        }
      }
      this._coveragePosCalculated = true;
      return [currentLine, currentColumn];
    }
  })
}

module.exports = {
  injectPrototype
}