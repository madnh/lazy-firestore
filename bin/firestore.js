#!/usr/bin/env node

const consola = require('consola');
const pkg = require('../package.json')
const cli = require('cac')('firestore');

cli.usage("<sub-command> [...options] [...sub command arguments]")
cli.help()
cli.version(pkg.version)

const cUpdate = require('../commands/update');
const cDelete = require('../commands/clean');
const cDump = require('../commands/dump');
const cRestore = require('../commands/restore');
const cTree = require('../commands/tree');
const cDoc = require('../commands/doc');
const cDoctor = require('../commands/doctor')

cDump(cli)
cRestore(cli)
cUpdate(cli)
cDelete(cli)
cTree(cli)
cDoc(cli)
cDoctor(cli)


// Print help when no command specified
cli.command('').action(() => cli.outputHelp())

try {
  cli.parse()
} catch (error) {
  consola.error(error.message)
}
