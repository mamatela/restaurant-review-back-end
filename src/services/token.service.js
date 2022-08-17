const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../../config');
const userService = require('./user.service');
const TokenModel = require('../db/models/Token.model');
const { NotFoundError } = require('../utils/errors');

const tokenService = {};

/**
 * Generate token
 * @param {Object} options - options
 * @param {number} options.userId
 * @param {Moment} options.expires
 * @param {string} options.type
 * @param {string} [options.privateKey]
 * @returns {string}
 */
tokenService.generateToken = ({ userId, expires, type, privateKey = config.jwt.privateKey }) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, privateKey);
};

/**
 * Save a token
 * @param {Object} tokenData - token data
 * @param {string} tokenData.token
 * @param {number} tokenData.userId
 * @param {Moment} tokenData.expires
 * @param {string} tokenData.type
 * @param {boolean} [token.blacklisted] defaults to false
 * @returns {Promise<Token>}
 */
tokenService.saveToken = async ({ token, userId, expires, type, blacklisted = false }) => {
  const tokenDoc = await TokenModel.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token validity and return decoded payload. Returns false in case of fail.
 * @param {string} token
 * @returns {Object | boolean} Decoded Payload
 */
tokenService.verifyAndDecodeToken = (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.privateKey);
    return decoded;
  }
  catch (err) {
    return false;
  }
};


/**
 * Verify token and return token doc (returns false if invalid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
tokenService.verifyTokenAndReturnDocument = async (token, type) => {
  let decoded = tokenService.verifyAndDecodeToken(token);
  if (!decoded) return false;
  return await TokenModel.findOne({ token, type, user: decoded.sub, blacklisted: false });
};

/**
 * Generate auth tokens
 * @param {User} user 
 * @returns {Promise<Object>}
 */
tokenService.generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = tokenService.generateToken({ userId: user._id, expires: accessTokenExpires, type: 'access' });

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = tokenService.generateToken({ userId: user._id, expires: refreshTokenExpires, type: 'refresh' });
  await tokenService.saveToken({ token: refreshToken, userId: user._id, expires: refreshTokenExpires, type: 'refresh' });

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
tokenService.generateResetPasswordToken = async (user) => {
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = tokenService.generateToken({ userId: user._id, expires, type: 'reset_password' });
  await tokenService.saveToken({ token: resetPasswordToken, userId: user._id, expires, type: 'reset_password' });
  return resetPasswordToken;
};



/**
 * Get token document (only refresh token and reset_password tokens are ever saved in mongoose)
 * @param {number} userId - id of the owner user
 * @returns {Object} Token Document
 */
tokenService.findRefreshTokenByUserId = async (userId) => {
  return await TokenModel.findOne({ user: userId, type: 'refresh' }).lean();
};


/**
 * Remove token document from DB. Throws or returns nothing.
 * @param {number} tokenId - id of the token document
 * @returns {void}
 */
tokenService.deleteToken = async (tokenId) => {
  return await TokenModel.deleteOne({ _id: tokenId });
};


/**
 * Remove all refresh tokens for a user
 * @param {number} userId id of user
 * @param {number} excludeId id to exclude from delete
 * @returns {void}
 */
tokenService.deleteAllRefreshTokens = async (userId, excludeId) => {
  return await TokenModel.deleteMany({ user: userId, type: 'refresh', _id: { $ne: excludeId } });
};


/**
 * Remove all tokens for a user
 * @param {number} userId
 * @returns {void}
 */
tokenService.deleteAllTokens = async (userId) => {
  return await TokenModel.deleteMany({ user: userId });
};


module.exports = tokenService;