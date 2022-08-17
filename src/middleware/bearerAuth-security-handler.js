const tokenService = require('../services/token.service');
const userService = require('../services/user.service');
const ahw = require('../utils/async-handler-wrapper');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');


/**
 * Authenticates request based on JWT and authorizes the user according to roles.
 * @param {Object} req Express Request
 * @param {Array<string>} scopes roles that are allowed to use this endpoint. Must provide at least 1 role.
 */
const bearerAuthSecurityHandler = async (req, scopes) => {
  if (!(scopes && scopes.length)) throw new Error('Must provide at least 1 role for authorization');

  let AuthorizationHeader = req.header('Authorization')
  if (!AuthorizationHeader) throw new UnauthorizedError('Please provide valid Authorization header');
  let token = AuthorizationHeader.replace('Bearer ', '');
  if (!token) throw new UnauthorizedError('Please provide valid Authorization header');

  let decoded = tokenService.verifyAndDecodeToken(token);
  if (!(decoded && decoded.type == 'access')) throw new UnauthorizedError('Invalid token');

  let user = await userService.selectById(decoded.sub);
  if (!user) throw new UnauthorizedError('Unable to authenticate. User not found.');

  // Authorization
  if (user.role !== 'admin') { // admin shall pass.
    if (!~scopes.indexOf(user.role)) {
      throw new ForbiddenError('You do not have sufficient permissions to perform this operation');
    }
  }

  req.user = user;
  return true;
};

module.exports = bearerAuthSecurityHandler;