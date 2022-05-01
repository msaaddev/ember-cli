'use strict';

const expect = require('../../chai').expect;
const { map } = require('ember-cli-lodash-subset');
const commandOptions = require('../../factories/command-options');
const NewCommand = require('../../../lib/commands/new');
const Blueprint = require('../../../lib/models/blueprint');
const Command = require('../../../lib/models/command');
const Task = require('../../../lib/models/task');
const td = require('testdouble');

describe('new command', function () {
  let command;

  beforeEach(function () {
    let options = commandOptions({
      project: {
        isEmberCLIProject() {
          return false;
        },
        blueprintLookupPaths() {
          return [];
        },
      },
    });

    command = new NewCommand(options);

    td.replace(Blueprint, 'lookup', td.function());
  });

  afterEach(function () {
    td.reset();
  });

  it("doesn't allow to create an application named `test`", async function () {
    let { message } = await expect(command.validateAndRun(['test'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `test`.');
  });

  it("doesn't allow to create an application named `ember`", async function () {
    let { message } = await expect(command.validateAndRun(['ember'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `ember`.');
  });

  it("doesn't allow to create an application named `Ember`", async function () {
    let { message } = await expect(command.validateAndRun(['Ember'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `Ember`.');
  });

  it("doesn't allow to create an application named `ember-cli`", async function () {
    let { message } = await expect(command.validateAndRun(['ember-cli'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `ember-cli`.');
  });

  it("doesn't allow to create an application named `vendor`", async function () {
    let { message } = await expect(command.validateAndRun(['vendor'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `vendor`.');
  });

  it("doesn't allow to create an application with a period in the name", async function () {
    let { message } = await expect(command.validateAndRun(['zomg.awesome'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `zomg.awesome`.');
  });

  it("doesn't allow to create an application with a name beginning with a number", async function () {
    let { message } = await expect(command.validateAndRun(['123-my-bagel'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `123-my-bagel`.');
  });

  it('shows a suggestion messages when the application name is a period', async function () {
    let { message } = await expect(command.validateAndRun(['.'])).to.be.rejected;
    expect(message).to.equal(
      `Trying to generate an application structure in this directory? Use \`ember init\` instead.`
    );
  });

  it('registers blueprint options in beforeRun', function () {
    td.when(Blueprint.lookup('app'), { ignoreExtraArgs: true }).thenReturn({
      availableOptions: [{ name: 'custom-blueprint-option', type: String }],
    });

    command.beforeRun(['app']);
    expect(map(command.availableOptions, 'name')).to.contain('custom-blueprint-option');
  });

  it('passes command options through to init command', async function () {
    command.tasks.CreateAndStepIntoDirectory = class extends Task {
      run() {
        return Promise.resolve();
      }
    };

    command.commands.Init = Command.extend({
      run(commandOptions) {
        expect(commandOptions).to.contain.keys('customOption');
        expect(commandOptions.customOption).to.equal('customValue');
        return Promise.resolve('Called run');
      },
    });

    td.when(Blueprint.lookup('app'), { ignoreExtraArgs: true }).thenReturn({
      availableOptions: [{ name: 'custom-blueprint-option', type: String }],
    });

    let reason = await command.validateAndRun(['foo', '--custom-option=customValue']);
    expect(reason).to.equal('Called run');
  });
});
