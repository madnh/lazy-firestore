const fs = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');
const consola = require('consola');
const converter = require("../utils/firestore-converter");
const { workingPath } = require('../utils/fs');
const { debug, dump, defaultConverter } = require('../utils/firestore');
const { isEmpty, sort, simpleClone } = require('../utils/obj');

module.exports = command

/**
 * @param {import('cac').CAC} cac
 */
function command(cac) {
  const command = 'dump'
  cac.command(`${command} [...name]`, 'Dump Firestore to file')
      .example((bin) => `${bin} ${command}`)
      .example((bin) => `${bin} ${command} case 1`)
      .example((bin) => `${bin} ${command} base`)
      .option('--debug', 'Use debug mode')
      .action(handler)
}

async function handler(name, options) {
  defaultConverter(converter)

  let subPath = getSubPath();
  if (options.debug) {
    debug(true)
  }

  if (name.length) {
    subPath += ' - ' + name.join(' ')
  }

  consola.info('Export to:', subPath)
  let dumpedData = await dump();

  if (isEmpty(dumpedData)) {
    consola.warn('Firestore is empty');
    return;
  }

  for (const collection in dumpedData) {
    console.group(collection + '/');

    const collectionDir = workingPath(subPath, collection);

    await fs.ensureDir(collectionDir);

    const docs = dumpedData[collection];
    const writePromises = [];

    for (let docId in docs) {
      console.log('└─ ' + docId);

      const doc = docs[docId];
      const docSorted = sort(simpleClone(doc));

      writePromises.push(writeJSON(doc, path.join(collectionDir, `${docId}.json`)));
      writePromises.push(writeJSON(docSorted, path.join(collectionDir, `_${docId}.sorted.json`), true));
    }

    console.groupEnd();
    console.log();

    await Promise.all(writePromises);
  }

}

function getSubPath() {
  return dayjs().format('YYYY_MM_DD HH_mm_ss');
}

async function writeJSON(value, filePath, beautiful = false) {
  const options = {};

  if (beautiful) {
    options.spaces = 2;
  }

  return fs.writeJSON(filePath, value, options);
}
