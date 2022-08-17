const nodemailer = require('nodemailer');
const config = require('../../config');
const logger = require('../utils/logger');

let lib = {};

let smtp = config.email.smtp;
if (smtp.host === 'smtp.gmail.com') {
  smtp = {
    service: 'gmail',
    auth: config.email.smtp.auth,
  }
}
lib.transport = nodemailer.createTransport(smtp);

if (config.env !== 'test') {
  lib.transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(err => {
      logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env')
      logger.error(err);
    });
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
lib.sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  return await lib.transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} user - User object
 * @param {string} token
 * @returns {Promise}
 */
lib.sendResetPasswordEmail = async (user, token) => {
  const subject = 'Reset password';
  const resetPasswordUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  const text = `Dear ${user.firstName || 'user'},

Please follow this link to reset your password: ${resetPasswordUrl}

If you did not request a password reset, please ignore this email.`;
  return await lib.sendEmail(user.email, subject, text);
};

module.exports = lib;