const fs = require('fs');
const path = require('path');
const consola = require('consola');
const inquirer = require("inquirer");

const { workingPath } = require('../utils/fs');
const { scanFiles } = require('../utils/scan');
const { debug, firestore } = require("../utils/firestore");
const { isEmpty } = require("../utils/obj");
const { error } = require("../utils/cli");
const dataDirPath = workingPath();

module.exports = command

const Modes = {
  Replace: 'replace',
  Merge: 'merge',
}

/**
 * @param {import('cac').CAC} cac
 */
function command(cac) {
  const command = 'update'
  cac.command(`${command} <doc>`, 'Update document with data in a JSON file')
      .example((bin) => `${bin} ${command} --path=city --file hanoi.json users/foo`)
      .option('--file <file>', 'Path to update file')
      .option('--path <path>', 'Update path, ex: tags')
      .option('--debug', 'Use debug mode')
      .option('--mode <merge|replace>', 'Update mode, accept: merge, replace', { default: Modes.Replace })
      .action(handler)
}

async function handler(doc, options) {
  if (options.debug) {
    debug(true);
  }

  let updateDocId = doc;
  if (!updateDocId) {
    return error('Update doc ID is required');
  }
  if (!doc.includes('/')) {
    return error('Doc argument is invalid, must in format: <collection>/<doc-id>');
  }
  if (!Object.values(Modes).includes(options.mode)) {
    return error(`Mode is invalid, only accepts: ${Object.values(Modes).join(', ')}`)
  }

  let updateFilename = options.file;

  if (!updateFilename) {
    const allFiles = await scanFiles(dataDirPath, 'json');

    if (!allFiles.length) {
      consola.error('No files to choose');
      return;
    }

    updateFilename = await selectFileToImport(allFiles.map(file => file.file));

    if (!updateFilename) {
      consola.error('File data is required');
      return;
    }

    updateFilename = workingPath(updateFilename);
  }

  updateFilename = path.resolve(updateFilename);

  if (!fs.existsSync(updateFilename)) {
    consola.error('File not found: ' + updateFilename);
    return;
  }


  consola.info('Update file: ', updateFilename);

  const updateData = require(updateFilename);

  if (isEmpty(updateData)) {
    consola.warn('Selected file is empty');
    return;
  }

  let dataToUpdate = updateData
  let updatePath = options.path;
  if (updatePath) {
    dataToUpdate = {
      [updatePath]: updateData
    }
  }

  await firestore.runTransaction(async (transaction) => {
    console.log('Start update');
    const docRef = firestore.doc(updateDocId);

    if (options.mode === Modes.Replace) {
      consola.info("Replace mode")
      return transaction.set(docRef, dataToUpdate, { merge: false });
    }

    if (options.mode === Modes.Merge) {
      consola.log('Merge mode');
      return transaction.set(docRef, dataToUpdate, { merge: true });
    }
  })


  console.log('');
  consola.success('Done');
}

async function selectFileToImport(files) {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'file',
      message: 'Select file to update',
      choices: files,
      pageSize: 50
    }
  ]);

  return answer.file;
}
