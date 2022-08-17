const mongoose = require('mongoose');
// const mai = require('mongoose-auto-increment');
// const paginatePlugin = require('mongoose-paginate-v2');
// const models = require('./models'); // just load all models

const config = require('../../config');

const init = () => {
  return new Promise((res, rej) => {
    let url = config.mongoose.url;
    mongoose.connect(url, config.mongoose.options).then((conn) => {

      // mai.initialize(conn);
      // conn.plugin(mai);
      // conn.plugin(paginatePlugin);
      res(conn);
    }).catch(err => rej(err));
  });
}

module.exports = { init };