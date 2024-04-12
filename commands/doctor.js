const consola = require('consola')
const { debug, dump, defaultConverter } = require('../utils/firestore')
const { isEmpty } = require('../utils/obj')
const converter = require('../utils/firestore-converter')

module.exports = command

/**
 * @param {import('cac').CAC} cac
 */
function command(cac) {
  const command = 'doctor'
  cac
    .command(`${command}`, 'Diagnose info to connection to Firestore')
    .example((bin) => `${bin} ${command}`)
    .action(handler)
}

async function handler(collections, options) {
  defaultConverter(converter)

  consola.info('Using Firestore emulator:', process.env.FIRESTORE_EMULATOR_HOST || 'Not set')
  consola.info('GCloud project: ', process.env.GCLOUD_PROJECT || 'Not set')
  consola.info('GOOGLE_APPLICATION_CREDENTIALS: ', process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Not set')
}
