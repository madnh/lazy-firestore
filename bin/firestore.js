#!/usr/bin/env node

const consola = require('consola');
const pkg = require('../package.json')
const cli = require('cac')('firestore');

cli.usage("<sub-command> [...options] [...sub command arguments]")

const cUpdate = require('../commands/update');
const cDelete = require('../commands/clean');
const cDump = require('../commands/dump');
const cRestore = require('../commands/restore');
const cTree = require('../commands/tree');
const cDoc = require('../commands/doc');

cDump(cli)
cRestore(cli)
cUpdate(cli)
cDelete(cli)
cTree(cli)
cDoc(cli)

cli.help()
cli.version(pkg.version)

try {
  cli.parse()
} catch (error) {
  consola.error(error.message)
}
