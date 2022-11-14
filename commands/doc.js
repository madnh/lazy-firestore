const consola = require('consola');
const { debug, getDocs, defaultConverter } = require('../utils/firestore');
const converter = require("../utils/firestore-converter");
const { inspect } = require('util');

module.exports = command

/**
 * @param {import('cac').CAC} cac
 */
function command(cac) {
  const command = 'doc'
  cac.command(`${command} [...docs]`, 'Dump Firestore documents')
      .example((bin) => `${bin} ${command}`)
      .example((bin) => `${bin} ${command} user/1`)
      .example((bin) => `${bin} ${command} user/1 user/2`)
      .example((bin) => `${bin} ${command} --collection user 1 2 posts/hello`)
      .option('--debug', 'Use debug mode')
      .option('--json', 'Print data in json format')
      .option('--collection <collection-name>', 'Base collection name')
      .option('--inspect-depth <inspect-depth>', 'Depth of data to inspect', { default: 20 })
      .action(handler)
}

async function handler(docs, options) {
  defaultConverter(converter)

  const collection = options.collection || ''
  const inspectDepth = options.inspectDepth || 20

  if (options.debug) {
    debug(true)
  }

  let docIds = docs

  if (!docIds.length) {
    consola.error('You must specified at least 1 document');
    process.exit(1)
  }

  if (collection) {
    docIds = docs.map(doc => {
      if (doc.includes('/')) return doc;
      return [collection, doc].map(s => s.trim()).join('/');
    })
  }

  const invalidDocIds = docIds.filter(doc => !doc.includes('/'))
  if (invalidDocIds.length) {
    console.warn('Invalid docs:');
    console.log(invalidDocIds.map(id => ' - ' + id).join('\n'));
  }

  const validDocIds = docIds.filter(doc => doc.includes('/'))
  if (!validDocIds.length) {
    consola.error('No valid docs found');
    process.exit(1)
  }

  const docSnapshots = await getDocs(...validDocIds)
  const dashes = '-'.repeat(10)
  for (const docSnapshot of docSnapshots) {
    console.group(`${dashes} ${docSnapshot.ref.path} ${dashes}`);
    console.log('Exists:', docSnapshot.exists);

    if (docSnapshot.exists) {
      console.log('Created at:', docSnapshot.createTime.toDate());
      console.log('Updated at:', docSnapshot.updateTime.toDate());
      const dataToPrint = docSnapshot.data();
      const printData = options.json ? JSON.stringify(dataToPrint, null, 2) : inspect(dataToPrint, { depth: inspectDepth, colors: true })
      console.log('Data:', printData);
    }

    console.groupEnd();
  }
}
