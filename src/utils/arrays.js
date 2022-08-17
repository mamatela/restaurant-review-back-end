
const convertMongooseSortToObject = (sort) => {
  let res = {};
  if (typeof sort === 'string') {
    const [key, val] = convertToKeyValuePair(sort);
    res[key] = val;
    return res;
  }

  if (!Array.isArray(sort)) throw new Error('sort must be a string or an array');

  return sort.reduce((a, e) => {
    const [key, val] = convertToKeyValuePair(e);
    a[key] = val;
    return a;
  }, res);

  function convertToKeyValuePair(str) {
    let key = str.replace('-', '');
    let val = key === str ? 1 : -1;
    return [key, val];
  }
}

module.exports = {
  convertMongooseSortToObject,
}