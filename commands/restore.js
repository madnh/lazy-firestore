const fs = require('fs-extra');
const path = require('path');
const consola = require('consola');
const inquirer = require("inquirer");

const { workingPath } = require('../utils/fs');
const { scanFolders, scanFiles } = require('../utils/scan');
const { restore, defaultConverter } = require("../utils/firestore");
const { pick, isEmpty } = require("../utils/obj");
const converter = require('../utils/firestore-converter');

module.exports = command

/**
 * @param {import('cac').CAC} cac
 */
function command(cac) {
  const command = 'restore'
  cac.command(`${command} [snapshot]`, 'Restore Firestore from exported data')
      .example((bin) => `${bin} ${command}`)
      .example((bin) => `${bin} ${command} "2021_08_04 09_45_42 - case 1"`)
      .example((bin) => `${bin} ${command} "2021_08_04 09_45_42 - case 1" --only users --only posts`)
      .option('--only <collection-name>', 'Collections to import', { type: [String] })
      .option('--dump', 'Dump tree of selected snapshot')
      .action(handler)
}

async function handler(snapshot, options) {
  defaultConverter(converter)

  const dataDirPath = workingPath();
  const allSnapshots = await getAvailableSnapshots(dataDirPath);

  let snapshotName;

  if (snapshot) {
    if (!allSnapshots.includes(snapshot)) {
      consola.error('Selected snapshot is not exists');
      return;
    }

    snapshotName = snapshot
  }
  if (!snapshotName) {
    snapshotName = await selectSnapshotFolder(allSnapshots);
  }

  consola.info('Snapshot: ', snapshotName);

  const snapshotData = await getSnapshotCollections(dataDirPath, snapshotName);

  if (isEmpty(snapshotData)) {
    consola.warn('Selected snapshot is empty');
    return;
  }

  if (options.dump) {
    consola.info('Snapshot Tree:');
    dumpSnapshotTree(snapshotData);
  }

  const restoreCollections = getRestoreCollections(options.only);
  let restoreData = snapshotData;

  if (restoreCollections) {
    console.log('');
    consola.info('Restore collections:', restoreCollections.join(', '));
    restoreData = pick(snapshotData, restoreCollections);
  }

  await restore(restoreData);

  console.log('');
  consola.success('Done');
}


async function getAvailableSnapshots(dir) {
  return scanFolders(dir);
}

/**
 * @param {string|string[]} only
 * @return {string[]|boolean}
 */
function getRestoreCollections(only) {
  if (only) {
    if (typeof only === 'string') {
      return [only];
    }
    if (Array.isArray(only)) {
      return only
    }

    consola.error('[only] parameter must be string or array of string');
    process.exit(1);
  }

  return false;
}

async function selectSnapshotFolder(folders) {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'subFolder',
      message: 'Seclect snapshoot to restore',
      choices: folders,
      pageSize: 50
    }
  ]);

  return answer.subFolder;
}

async function getSnapshotCollections(dir, snapshotName) {
  const snapshotDirPath = path.resolve(dir, snapshotName);
  const result = {};

  const collections = await scanFolders(snapshotDirPath);

  for (const collection of collections) {
    const collectionPath = path.resolve(snapshotDirPath, collection);
    const docs = await getSnapshotDocs(collectionPath);

    if (docs) {
      result[collection] = docs;
    }
  }

  return result;
}

async function getSnapshotDocs(collectionPath) {
  const data = {};

  const files = await scanFiles(collectionPath, 'json');

  for (const file of files) {
    // Ignore test files
    if (file.file.startsWith('_')) {
      continue;
    }

    const filePath = path.resolve(collectionPath, file.file);
    data[file.cleanName] = await fs.readJson(filePath);
  }

  return data;
}

function dumpSnapshotTree(snapshotData) {
  for (const collection in snapshotData) {
    if (snapshotData.hasOwnProperty(collection)) {
      const docs = snapshotData[collection];

      console.group(collection);
      Object.keys(docs).forEach(doc => {
        console.log('└─ ' + doc);
      });
      console.groupEnd();
    }
  }
}
