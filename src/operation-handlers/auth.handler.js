const ahw = require('../utils/async-handler-wrapper');
const { userService, tokenService, emailService } = require('../services');
const { NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError } = require('../utils/errors');

const lib = {};

lib.register = ahw(async (req, res, next) => {
  if (!userService.checkPasswordRequirements(req.body.password)) {
    throw new BadRequestError('Password must contain at least one letter and one number');
  }
  let user = await userService.createNew(req.body);
  let tokens = await tokenService.generateAuthTokens(user);

  res.status(201).send({ user, tokens });
});


lib.login = ahw(async (req, res, next) => {
  let user = await userService.selectByEmailAndPassword(req.body.email, req.body.password);
  if (!user) throw new UnauthorizedError('Incorrect email or password');
  let tokens = await tokenService.generateAuthTokens(user);

  res.send({ user, tokens });
});


lib.logout = ahw(async (req, res, next) => {
  let refreshToken = await tokenService.verifyTokenAndReturnDocument(req.body.refreshToken, 'refresh');
  if (!refreshToken) throw new UnauthorizedError('Invalid refresh token');
  await tokenService.deleteAllRefreshTokens(refreshToken.user);
  res.status(204).send();
});


lib.refreshTokens = ahw(async (req, res, next) => {
  // Verify refresh token
  let refreshToken = await tokenService.verifyTokenAndReturnDocument(req.body.refreshToken, 'refresh');
  if (!refreshToken) throw new UnauthorizedError('Invalid refresh token');
  let user = await userService.selectById(refreshToken.user);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // delete old token
  await tokenService.deleteToken(refreshToken._id);

  let tokens = await tokenService.generateAuthTokens(user);
  res.send({ tokens, user });
});


lib.forgotPassword = ahw(async (req, res, next) => {
  let user = await userService.selectByEmail(req.body.email);
  if (!user) throw new NotFoundError('There is no user with this email');

  let resetPasswordToken = await tokenService.generateResetPasswordToken(user);
  await emailService.sendResetPasswordEmail(user, resetPasswordToken);

  res.status(204).send();
});


lib.resetPassword = ahw(async (req, res, next) => {
  // extract info from token
  let token = await tokenService.verifyTokenAndReturnDocument(req.query.token, 'reset_password');
  if (!token) throw new UnauthorizedError('Invalid token');

  if (!userService.checkPasswordRequirements(req.body.password)) {
    throw new BadRequestError('Password must contain at least one letter and one number');
  }

  let user = await userService.selectById(token.user);
  if (!user) throw new NotFoundError('User not found');

  await userService.updateById(user._id, { password: req.body.password });

  // Delete existing tokens
  await tokenService.deleteAllTokens(user._id);
  res.status(204).send();
});

module.exports = lib;