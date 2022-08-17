const moment = require('moment');
const config = require('../../config');
const tokenService = require('../../src/services/token.service');
const {admin, customer1, customer2, owner1, owner2} = require('./user.fixture');

const lib = {};

const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');

lib.adminAccessToken = tokenService.generateToken({ userId: admin._id, expires, type: 'access' });
lib.customer1AccessToken = tokenService.generateToken({ userId: customer1._id, expires, type: 'access' });
lib.customer2AccessToken = tokenService.generateToken({ userId: customer2._id, expires, type: 'access' });
lib.owner1AccessToken = tokenService.generateToken({ userId: owner1._id, expires, type: 'access' });
lib.owner2AccessToken = tokenService.generateToken({ userId: owner2._id, expires, type: 'access' });

lib.adminRefreshToken = tokenService.generateToken({ userId: admin._id, expires, type: 'refresh' });
lib.customer1RefreshToken = tokenService.generateToken({ userId: customer1._id, expires, type: 'refresh' });
lib.customer2RefreshToken = tokenService.generateToken({ userId: customer2._id, expires, type: 'refresh' });
lib.owner1RefreshToken = tokenService.generateToken({ userId: owner1._id, expires, type: 'refresh' });
lib.owner2RefreshToken = tokenService.generateToken({ userId: owner2._id, expires, type: 'refresh' });

module.exports = lib;
