const tokenService = require('../services/token.service');
const userService = require('../services/user.service');
const ahw = require('../utils/async-handler-wrapper');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');


/**
 * Authenticates request based on JWT and authorizes the user according to roles.
 * @param {...string} roles roles that are allowed to use this endpoint. Must provide at least 1 role.
 */
module.exports = (...roles) => {
  if (!(roles && roles.length)) throw new Error('Must provide at least 1 role for authorization');

  return ahw(async (req, res, next) => {
    let AuthorizationHeader = req.header('Authorization')
    if (!AuthorizationHeader) throw new UnauthorizedError('Please provide valid Authorization header');
    let token = AuthorizationHeader.replace('Bearer ', '');
    if (!token) throw new UnauthorizedError('Please provide valid Authorization header');

    let decoded = tokenService.verifyAndDecodeToken(token);
    if (!decoded) throw new UnauthorizedError('Invalid token');

    let user = await userService.selectById(decoded.sub);

    // Authorization
    if (user.role !== 'admin') { // admin shall pass.
      if (!~roles.indexOf(user.role)) {
        throw new ForbiddenError('You do not have sufficient permissions to perform this operation');
      }
    }

    req.user = user;
    next();
  })
};