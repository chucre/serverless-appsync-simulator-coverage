'use strict';
const { collectAndWriteFiles } = require('./lib/collect');
const { prepareCoverageFolder } = require('./lib/folderPreparation');
const { injectPrototype } = require('./lib/prototype');

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
    injectPrototype(velocityPrototype);

  }

  collectCoverage() {
    try {
      this.serverless.cli.log('Collecting coverage');
      const simulator = this.getSimulator();
      if (!simulator) {
        return this.serverless.cli.log('Appsync Simulator not found');
      }
      prepareCoverageFolder('coverage')
      collectAndWriteFiles(simulator.mappingTemplates, 'coverage');
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
