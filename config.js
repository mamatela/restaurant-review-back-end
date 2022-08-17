const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

let config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  frontendUrl: process.env.FRONTEND_URL,
  staticImagesPath: process.env.STATIC_IMAGES_PATH,
  mongoose: {
    url: process.env.DB_URL + (process.env.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useUnifiedTopology: true,
      useCreateIndex: true,
      useNewUrlParser: true,
      useFindAndModify: false,
    }
  },
  jwt: {
    privateKey: process.env.JWT_PRIVATEKY,
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES * (process.env.NODE_ENV === 'dev' ? 100 : 1),
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: process.env.JWT_REFRESH_RESET_PASSWORD_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === 465,
      auth: {
        user: process.env.SMPT_AUTH_USER,
        pass: process.env.SMPT_AUTH_PASS,
      }
    },
    from: process.env.EMAIL_FROM,
  }
};

module.exports = config;
