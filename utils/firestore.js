const consola = require('consola');
const { Firestore, setLogFunction } = require('@google-cloud/firestore');
const pLimit = require('p-limit');

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
 * @param {...string} docIds
 * @return {Promise<Array<DocumentSnapshot<FirebaseFirestore.DocumentData>>>}
 */
async function getDocs(...docIds) {
  const docs = docIds.map(docId => firestore.doc(docId).withConverter(converter))
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

function docRef(docId) {
  return firestore.doc(docId).withConverter(converter);
}


function collectionRef(collectionId) {
  return firestore.collection(collectionId).withConverter(converter);
}

async function restore(snapshot) {
  const tasks = [];
  const limit = pLimit(1);

  for (const collection in snapshot) {
    if (!snapshot.hasOwnProperty(collection)) {
      continue
    }

    const docs = snapshot[collection];

    for (const docId in docs) {
      if (!docs.hasOwnProperty(docId)) {
        continue
      }

      const docRef = firestore.doc([collection, docId].join('/')).withConverter(converter);
      tasks.push(limit(() => docRef.set(docs[docId])));
    }
  }

  return Promise.all(tasks)
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
  getDocs,
  dump,
  docRef,
  collectionRef,
  restore,
  set,
}
