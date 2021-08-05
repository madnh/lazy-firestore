/* eslint-disable callback-return*/

function getPathParts(path) {
  let parts;

  if (typeof path === 'string') {
    parts = path.split(/[./]/g)
  } else if (path instanceof Array) {
    parts = [...path];
  }

  if (!(parts instanceof Array)) {
    throw new Error('Invalid path, must be string or array')
  }

  return parts;
}

function hasKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function getObjPath(obj, path) {
  let point = obj;
  let parts = getPathParts(path);
  for (let part of parts) {
    if (hasKey(point, part)) {
      point = point[part];
      continue;
    }

    throw new Error('Not found')
  }

  return point;
}

function hasPath(obj, path) {
  try {
    getObjPath(obj, path);

    return true;
  } catch (e) {
    //
  }

  return false;
}

function has(obj, path) {
  if (/[/.]/.test(path)) {
    return hasPath(obj, path)
  }

  return hasKey(obj, path)
}

function getPath(obj, path, default_value = undefined) {
  try {
    return getObjPath(obj, path);
  } catch (e) {
    //
  }

  return default_value;
}

function forEach(obj, cb) {
  let i = 0;
  const keys = Object.keys(obj);

  for (const key of keys) {
    cb(obj[key], key, obj, i++)
  }
}

/**
 * Filter object, keep only valid key-value pair
 * @param {{}} obj
 * @param {function(*, string, {}, number)} cb Parameters: 0 - value, 1 - key, 2 - original object, 3 - loop index
 * @return {{}}
 */
function filter(obj, cb) {
  let i = 0;
  const result = {};

  const keys = Object.keys(obj);

  for (const key of keys) {
    const isValid = cb(obj[key], key, obj, i++);

    if (isValid) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * Get list of valid keys
 * @param {{}} obj
 * @param {function(*, string, {})} cb Parameters: 0 - value, 1 - key, 2 - original object
 * @return {string[]}
 */
function filterKey(obj, cb) {
  return Object.keys(obj).filter(key => cb(obj[key], key, obj));
}

/**
 *
 * @param {{}} obj
 * @param {string[]} keys
 * @return {{}}
 */
function pick(obj, keys) {
  const result = {};
  for (let key of keys) {
    if (hasKey(obj, key)) {
      result[key] = obj[key]
    }
  }
  return result;
}

/**
 * @param {{}} obj
 * @param {string[]}keys
 * @return {{}}
 */
function omit(obj, keys) {
  const result = {};
  const objKeys = Object.keys(obj);

  for (let key of objKeys) {
    if (!keys.includes(key)) {
      result[key] = obj[key]
    }
  }

  return result;
}

function findKey(obj, cb) {
  const keys = Object.keys(obj);

  for (let key of keys) {
    const isMatch = cb(obj[key], key, obj);
    if (isMatch) {
      return key;
    }
  }

  return undefined;
}

/**
 * @param obj
 * @param {function(value: string, key: string, currentObj: Object, result: Object, index: number)} cb
 * @return {{}}
 */
function map(obj, cb) {
  let i = 0;
  const result = {};
  const keys = Object.keys(obj);

  for (let key of keys) {
    result[key] = cb(obj[key], key, obj, result, i++);
  }

  return result;
}

function combine(keys, values, missing_value = undefined) {
  const result = {};
  const asArray = values instanceof Array;

  keys.forEach((key, index) => {
    let value;

    if (asArray) {
      value = hasKey(values, index) ? values[index] : missing_value;
    } else {
      value = values;
    }

    result[key] = value;
  });

  return result;
}

function size(obj) {
  return Object.keys(obj).length
}

function isEmpty(obj) {
  return !Object.keys(obj).length
}


function renameKey(obj, renameMap) {
  const result = {};

  let keys = Object.keys(obj);
  for (const key of keys) {
    const newKey = has(renameMap, key) ? renameMap[key] : key;
    result[newKey] = obj[key];
  }

  return result;
}

function pickRef(obj, pickMap, default_value = undefined) {

  const result = {};

  forEach(pickMap, (newKey, oldKey) => {
    result[newKey] = has(obj, oldKey) ? getPath(obj, oldKey) : default_value
  });

  return result;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function sort(obj) {
  if (obj instanceof Array) {
    return obj.map(item => sort(item));
  }

  if (!isPlainObject(obj)) {
    return obj
  }

  const result = {};
  const keys = Object.keys(obj);

  keys.sort();
  keys.forEach(key => {
    result[key] = sort(obj[key])
  });

  return result;
}

function simpleClone(value) {
  return JSON.parse(JSON.stringify(value))
}


module.exports = {
  hasPath,
  getPath,
  hasKey,
  has,
  forEach,
  filter,
  filterKey,
  map,
  combine,
  pick,
  omit,
  findKey,
  size,
  isEmpty,
  renameKey,
  pickRef,
  isPlainObject,
  sort,
  simpleClone
};
