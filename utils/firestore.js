/**
 * @typedef {path: string, data: any} DocItem
 * @typedef {DocItem[]} DocsList
 */

const consola = require('consola');
const { Firestore, setLogFunction } = require('@google-cloud/firestore');

let firestore;
let converter = null

try {
  firestore = new Firestore();
} catch (e) {
  consola.error(e);
  process.exit(1);
}


function debug(debug) {
  if (debug) {
    setLogFunction(console.log);
  } else {
    setLogFunction(() => {
    });
  }
}

function setting(cb) {
  cb(firestore);
}

function defaultConverter(cvt) {
  converter = cvt
}

module.exports.collections = async function collections() {
  return firestore.listCollections()
      .then(collections => {
        return collections.map(collection => collection.id)
      })
}

async function clearCollection(collectionName) {
  const colRef = firestore.collection(collectionName);
  const docsRef = await colRef.listDocuments();

  const removed = [];

  for (const docRef of docsRef) {
    await docRef.delete();

    removed.push(docRef.id);
  }

  return removed;
}

/**
 * @param {string} docId
 * @returns {DocumentSnapshot<FirebaseFirestore.DocumentData>}
 */
function getDocQuery(docId){
  return firestore.doc(docId).withConverter(converter)
}

/**
 * @param {...string} docIds
 * @return {Promise<Array<DocumentSnapshot<FirebaseFirestore.DocumentData>>>}
 */
async function getDocs(...docIds) {
  const docs = docIds.map(docId => getDocQuery(docId))
  return firestore.getAll(...docs);
}

async function dump({ collections = true, includeValue = true } = {}) {
  const result = {};
  const colRefs = await firestore.listCollections();

  if (!(collections === true || collections instanceof Array)) {
    throw new Error('Collections options must be True or array of string');
  }

  const dumpColRefs = collections === true ? colRefs : colRefs.filter(colRef => collections.includes(colRef.id))

  function setDoc(colId, docId, docValue) {
    if (!result[colId]) {
      result[colId] = {};
    }

    result[colId][docId] = docValue;
  }

  for (const colRef of dumpColRefs) {
    const colId = colRef.id;
    const docRefs = await colRef.withConverter(converter).listDocuments();

    if (includeValue) {
      const docSnapshots = await firestore.getAll(...docRefs);

      for (let docSnapshot of docSnapshots) {
        if (docSnapshot.exists) {
          setDoc(colId, docSnapshot.id, docSnapshot.data());
        }
      }
    } else {
      for (let docRef of docRefs) {
        setDoc(colId, docRef.id, null);
      }
    }

  }

  return result;
}

/**
 * @param {string} docId
 * @return DocumentReference
 */
function docRef(docId) {
  return firestore.doc(docId).withConverter(converter);
}


function collectionRef(collectionId) {
  return firestore.collection(collectionId).withConverter(converter);
}

/**
 * @param {{}} snapshot
 * @return {Promise<number>} number of docs restored
 */
async function restore(snapshot) {
  /**
   * @type {DocsList}
   */
  const allDocs = []
  const collections = Object.keys(snapshot).sort()

  // create docs
  for (const collection of collections) {
    const docs = snapshot[collection];

    for (const docId in docs) {
      allDocs.push({
        path: [collection, docId].join('/'),
        data: docs[docId]
      })
    }
  }

  return await writeBatch(allDocs);
}


/**
 * @param {*[]} items
 * @param {number} size
 * @return {*[]}
 */
function splitToChunks(items, size) {
  const chunks = []

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks;
}

/**
 *
 * @param {DocsList} docs
 * @return {Promise<number>}
 */
async function writeBatch(docs) {
  const chunks = splitToChunks(docs, 500)
  let count = 0

  for await (const chunk of chunks) {
    const writeBatch = firestore.batch()

    chunk.forEach(doc => {
      const documentRef = firestore.doc(doc.path).withConverter(converter);
      writeBatch.set(documentRef, doc.data);
    })

    await writeBatch.commit()
    count += chunk.length
    console.log('Restored: ', count);
  }

  return count;
}

/**
 * @param {DocumentReference[]} docs
 * @return {Promise<number>}
 */
async function deleteBatch(docs) {
  const chunks = splitToChunks(docs, 500)
  let count = 0

  for await (const chunk of chunks) {
    const writeBatch = firestore.batch()
    chunk.forEach(doc => writeBatch.delete(doc))
    await writeBatch.commit()
    count += chunk.length
  }

  return count;
}

async function set(docId, data, options = {}) {
  return firestore.doc(docId).withConverter(converter).set(data, options);
}


module.exports = {
  firestore,
  debug,
  setting,
  defaultConverter,
  clearCollection,
  getDocQuery,
  getDocs,
  dump,
  docRef,
  collectionRef,
  restore,
  deleteBatch,
  set,
}
