const { Timestamp } = require('@google-cloud/firestore');
/**
 * @type {import("@google-cloud/firestore").FirestoreDataConverter}
 */
const converter = {
  fromFirestore(snapshot) {
    const data = snapshot.data()
    return recursiveCastTimestamp(data)
  },
  toFirestore(data) {
    return recursiveConvertDate(data);
  }
}

module.exports = converter

function recursiveCastTimestamp(object) {
  const valueType = typeof object
  if (object === null || undefined === object || valueType === 'string' || valueType === 'number' || valueType === 'boolean') return object
  const result = {}
  for (const [key, value] of Object.entries(object)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate()
    } else if (Array.isArray(value)) {
      result[key] = value.map((valueItem) => recursiveCastTimestamp(valueItem))
    } else if (value !== null && typeof value === 'object') {
      result[key] = recursiveCastTimestamp(value)
    } else {
      result[key] = value
    }
  }
  return result;
}

function recursiveConvertDate(object) {
  const valueType = typeof object
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') return object
  const result = {}
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'string' && value.startsWith('2') && value.endsWith('Z')) {
      let valueAsDate = new Date(value)

      // console.log(valueAsDate);
      if (valueAsDate.valueOf()) {
        result[key] = valueAsDate
      } else {
        result[key] = value
      }
    } else if (Array.isArray(value)) {
      result[key] = value.map((valueItem) => recursiveConvertDate(valueItem))
    } else if (value !== null && typeof value === 'object') {
      result[key] = recursiveConvertDate(value)
    } else {
      result[key] = value
    }
  }
  return result;
}
