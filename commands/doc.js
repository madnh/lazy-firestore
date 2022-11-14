const consola = require('consola');
const beeper = require('beeper')
const { diff } = require('jest-diff')
const { debug, docRef, getDocs, defaultConverter } = require('../utils/firestore');
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
      .example((bin) => `${bin} ${command} --collection user 1 2 posts/hello --watch`)
      .example((bin) => `${bin} ${command} --collection user 1 2 posts/hello --watch --no-beep --no-diff`)
      .option('--debug', 'Use debug mode')
      .option('--watch', 'Watch changes of documents')
      .option('--beep', '[Watch mode] Play "beep" when a change found', { default: false })
      .option('--diff', '[Watch mode] Print what changed only', { default: true })
      .option('--json', 'Print data in json format')
      .option('--utc', 'Print date in ISO 8601 format', { default: false })
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

  function dumpDocDetail(docSnapshot) {
    console.log('Exists:', docSnapshot.exists);

    if (docSnapshot.exists) {
      let createTime = docSnapshot.createTime.toDate();
      let updateTime = docSnapshot.updateTime.toDate();

      console.log('Created at:', options.utc ? createTime : createTime.toLocaleString());
      console.log('Updated at:', options.utc ? updateTime : updateTime.toLocaleString());

      const dataToPrint = docSnapshot.data();
      const printData = options.json ? JSON.stringify(dataToPrint, null, 2) : inspect(dataToPrint, {
        depth: inspectDepth,
        colors: true
      })
      console.log('Data:', printData);
    }
  }

  function dumpDocInGroup(docSnapshot, version = undefined) {
    const dashes = '-'.repeat(5)
    let groupLabel = `${dashes} ${docSnapshot.ref.path} ${dashes}`

    if (version !== undefined) {
      groupLabel = `${dashes} ${docSnapshot.ref.path} #${version} ${dashes}`
    }

    console.log('\n')
    console.group(groupLabel);
    dumpDocDetail(docSnapshot);
    console.groupEnd();
    console.log('\n')
  }

  function dumpDocInGroupWatch(changeIndex, docSnapshot, changedData) {
    const dashes = '-'.repeat(5)
    const now = new Date()
    console.group(`\n${dashes} ${docSnapshot.ref.path} #${changeIndex} at ${now.toLocaleTimeString()} ${dashes}`);
    console.log(changedData)

    console.groupEnd();
    console.log('\n')
  }

  if (!options.watch) {
    const docSnapshots = await getDocs(...validDocIds)
    for (const docSnapshot of docSnapshots) {
      dumpDocInGroup(docSnapshot);
    }
  } else {
    console.log('Watching for changes....')
    const latest = new Map()
    for (const docId of validDocIds) {
      const query = docRef(docId)
      query.onSnapshot(async (querySnapshot) => {
        const nowData = querySnapshot.data() || {}
        const latestDocData = latest.get(docId) || {}
        let currentVersion = latestDocData.version || 1

        if (options.beep && latestDocData.data) {
          await beeper(1)
        }

        if (options.diff && latestDocData.data) {
          const changed = diff(latestDocData.data, nowData, {
            aAnnotation: `Old`,
            bAnnotation: 'Modified',
          })

          currentVersion += 1
          dumpDocInGroupWatch(currentVersion, querySnapshot, changed)
        } else {
          dumpDocInGroup(querySnapshot, currentVersion)
        }

        latest.set(docId, {
          version: currentVersion,
          data: nowData
        })
      });
    }
  }


}
