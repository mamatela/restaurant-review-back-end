
/**
 * Extracts custom path properties from express object that are defined in oas.yaml, such as x-eov-operation-id
 * @param {Object} req Express Request Object
 */
let extractCustomOpenapiPathProperties = (req) => {
  let res = {};
  if (req.openapi && req.openapi.schema) {
    for (let k of pickOnlyCustomKeys(Object.getOwnPropertyNames(req.openapi.schema))) {
      res[convertToCamelCase(k)] = req.openapi.schema[k];
    }
  }
  return res;
};

function pickOnlyCustomKeys(keys) {
  return keys.filter(e => e.indexOf('x-eov-') === 0);
}

function convertToCamelCase(key) {
  return key.split('-').reduce((a, e) => a + capitalize(e));
}

function capitalize(w) {
  return w[0].toUpperCase() + w.slice(1);
}

module.exports = extractCustomOpenapiPathProperties;