const consola = require("consola");
const inquirer = require("inquirer");

const { dump, docRef, debug } = require('../utils/firestore');
const { forEach, isEmpty } = require('../utils/obj');

module.exports = command

/**
 * @param {import('cac').CAC} cac
 */
function command(cac) {
  const command = 'clean'
  cac.command(`${command}`, "Clean Firestore - delete all documents, only use with Emulator's Firestore")
      .example((bin) => `${bin} ${command}`)
      .option('--debug', 'Use debug mode')
      .action(handler)
}

async function handler(options) {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    consola.error('Only support local environment, please set `FIRESTORE_EMULATOR_HOST` variable');
    process.exit(1);
  }

  consola.info('Firestore emulator host:', process.env.FIRESTORE_EMULATOR_HOST);

  if (options.debug) {
    debug(true);
  }

  const tree = await dump({ includeValue: false });

  if (isEmpty(tree)) {
    consola.info('Firestore is empty');
    return;
  }

  const selectedDocs = await selectDocs(tree);

  for (const selectedDoc of selectedDocs) {
    consola.start(selectedDoc);
    const ref = docRef(selectedDoc);
    await ref.delete();
  }

  consola.success('Done');
}

async function selectDocs(docs) {
  const choices = [];

  forEach(docs, (colDocs, colName) => {
    choices.push(new inquirer.Separator(` -- ${colName} --`));

    Object.keys(colDocs).forEach(docId => {
      choices.push({
        name: docId,
        value: [colName, docId].join('/')
      });
    });
  });

  const answer = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'docs',
      message: 'Select docs to clear',
      choices: choices,
      pageSize: 50
    }
  ]);

  return answer.docs;
}
