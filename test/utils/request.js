const spt = require('supertest');
const app = require('../../src/app');

const request = (token) => {
  let r = spt(app);
  if (token) r.set('Authorization', token);
  return r;
}

module.exports = request;