const fs = require('fs-extra');
const path = require('path');
const consola = require('consola');
const inquirer = require("inquirer");

const { workingPath } = require('../utils/fs');
const { scanFolders, scanFiles } = require('../utils/scan');
const { restore, defaultConverter, debug } = require("../utils/firestore");
const { pick, isEmpty, omit } = require("../utils/obj");
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
      .example((bin) => `${bin} ${command} "2021_08_04 09_45_42 - case 1" --only users --only posts,news --excepts=users`)
      .option('--only <collections>', 'Collections to import, support separate multi collection by comma, Ex: --only user --only=logs,news')
      .option('--except <collections>', 'Collections to exclude, support separate multi collection by comma. Ex: --except=user,logs')
      .option('--dump', 'Dump tree of selected snapshot')
      .option('--debug', 'Use debug mode')
      .option('--dryRun', 'Dry-run mode')
      .action(handler)
}

async function handler(snapshot, options) {
  defaultConverter(converter)

  if (options.debug) {
    debug(true)
  }

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
  consola.start('Load data')
  const snapshotData = await getSnapshotCollections(dataDirPath, snapshotName);

  if (isEmpty(snapshotData)) {
    consola.warn('Selected snapshot is empty');
    return;
  }

  consola.info('Found collections:')
  console.log(Object.keys(snapshotData).map(s => ' - ' + s).join("\n"));

  if (options.dump) {
    consola.info('Snapshot Tree:');
    dumpSnapshotTree(snapshotData);
  }

  const restoreCollections = parseCollectionsOption(options.only);
  const ignoreCollections = parseCollectionsOption(options.except);
  let restoreData = snapshotData;

  if (restoreCollections) {
    console.log('');
    consola.info('Restore collections:', restoreCollections.join(', '));
    restoreData = pick(snapshotData, restoreCollections);
  }
  if (ignoreCollections) {
    console.log('');
    consola.info('Ignore collections:', ignoreCollections.join(', '));
    restoreData = omit(snapshotData, ignoreCollections);
  }

  console.log('\nCollections to restore: \n', Object.keys(restoreData).sort().map(collection => ' - ' + collection).join("\n").trim());

  if (options.dryRun) {
    console.info("Dry-run mode, so bye!")
    return
  }

  consola.start("Start restoring...")
  const written = await restore(restoreData);

  consola.info(`Wrote: ${written}`);
  consola.success('Done');
}


async function getAvailableSnapshots(dir) {
  return scanFolders(dir);
}

/**
 * @param {string|string[]|undefined} value
 * @return {string[]|boolean}
 */
function parseCollectionsOption(value) {
  if (value) {
    if (typeof value === 'string') {
      return value.split(',');
    }
    if (Array.isArray(value)) {
      return value.map(str => str.split(',')).flat()
    }
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
