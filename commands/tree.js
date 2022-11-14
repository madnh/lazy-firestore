const consola = require('consola');
const { debug, dump, defaultConverter } = require('../utils/firestore');
const { isEmpty } = require('../utils/obj');
const converter = require("../utils/firestore-converter");

module.exports = command

/**
 * @param {import('cac').CAC} cac
 */
function command(cac) {
  const command = 'tree'
  cac.command(`${command} [...collections]`, 'Print Firestore structure')
      .example((bin) => `${bin} ${command}`)
      .example((bin) => `${bin} ${command} news users`)
      .option('--debug', 'Use debug mode')
      .action(handler)
}

async function handler(collections, options) {
  defaultConverter(converter)

  if (options.debug) {
    debug(true)
  }

  let filterCollections = true

  if (collections.length) {
    filterCollections = collections
    consola.info("Collections: ", collections.join(', '))
  }

  let dumpedData = await dump({
    collections: filterCollections,
    includeValue: false
  });

  if (isEmpty(dumpedData)) {
    if (Array.isArray(filterCollections)) {
      consola.info('Result is empty');
    } else {
      consola.info('Firestore is empty');
    }

    return;
  }

  for (const collection in dumpedData) {
    console.group(collection + '/');

    const docs = dumpedData[collection];

    for (let docId in docs) {
      console.log('└─ ' + docId);
    }

    console.groupEnd();
    console.log();
  }

}
