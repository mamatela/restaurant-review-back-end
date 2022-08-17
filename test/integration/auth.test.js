const moment = require('moment');
const config = require('../../config');
const { dbSetupAndTearDown } = require('../utils/setupTestDB');
const { customer1, insertUser, customer2 } = require('../fixtures/user.fixture');
const { customer1AccessToken, customer1RefreshToken, customer2RefreshToken } = require('../fixtures/token.fixture');
const request = require('supertest');
const app = require('../../src/app');
// const request = require('../utils/request');
const { User, Token } = require('../../src/db/models');
const tokenService = require('../../src/services/token.service');

dbSetupAndTearDown();

describe('[Auth]', () => {
  let newCustomer;
  describe('post /v1/auth/register', () => {
    beforeEach(() => {
      newCustomer = {
        email: 'customer@example.com',
        firstName: 'customer',
        lastName: 'customer',
        role: 'customer',
        password: 'string123'
      }
    });

    test('should return 201 for correct input. Response should include user and token data but no password. Password in db should not be plain-text', async () => {
      const { body } = await request(app).post('/v1/auth/register').send(newCustomer).expect(201);
      expect(body).toBeTruthy();
      expect(body.user).not.toHaveProperty('password');
      expect(body.user).toEqual({ email: newCustomer.email, firstName: newCustomer.firstName, lastName: newCustomer.lastName, role: newCustomer.role, _id: expect.anything() });
      expect(body.tokens.access).toEqual({ token: expect.anything(), expires: expect.anything() });
      expect(body.tokens.refresh).toEqual({ token: expect.anything(), expires: expect.anything() });

      let user = await User.findById(1);
      expect(user.password).not.toEqual(newCustomer.password);
    });

    test('should return 400 for same email', async () => {
      await insertUser('owner1');
      newCustomer.email = 'owner1@example.com';
      const { body } = await request(app).post('/v1/auth/register').send(newCustomer).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 for extra properties', async () => {
      newCustomer.extra = 'extra';
      const { body } = await request(app).post('/v1/auth/register').send(newCustomer).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 for missing required fields', async () => {
      delete newCustomer.email;
      const { body } = await request(app).post('/v1/auth/register').send(newCustomer).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 for invalid role', async () => {
      newCustomer.role = 'invalid';
      const { body } = await request(app).post('/v1/auth/register').send(newCustomer).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 for <8 digit password', async () => {
      newCustomer.password = 'string1';
      const { body } = await request(app).post('/v1/auth/register').send(newCustomer).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 for only-letters password', async () => {
      newCustomer.password = 'stringgggg';
      const { body } = await request(app).post('/v1/auth/register').send(newCustomer).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 for only-numbers password', async () => {
      newCustomer.password = '12345677889';
      const { body } = await request(app).post('/v1/auth/register').send(newCustomer).expect(400);
      expect(body.code).toEqual(400);
    });

  });

  let loginInfo;
  describe('post /v1/auth/login', () => {
    loginInfo = {
      email: 'customer1@example.com',
      password: 'string123',
    }
    test('should return 200 with correct input. Response should have tokens and user data but no password', async () => {
      await insertUser('customer1');
      const { body } = await request(app).post('/v1/auth/login').send(loginInfo).expect(200);
      expect(body.tokens.access).toEqual({ token: expect.anything(), expires: expect.anything() });
      expect(body.tokens.refresh).toEqual({ token: expect.anything(), expires: expect.anything() });
      expect(body.user).not.toHaveProperty('password');
      expect(body.user).toEqual({ ...customer1, password: undefined, _id: expect.anything() });
    });

    test('should return 401 with bad email', async () => {
      await insertUser('customer1');
      loginInfo.email = 'invalid@example.com';
      const { body } = await request(app).post('/v1/auth/login').send(loginInfo).expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 401 with bad password', async () => {
      await insertUser('customer1');
      loginInfo.password = 'invalid';
      const { body } = await request(app).post('/v1/auth/login').send(loginInfo).expect(401);
      expect(body.code).toEqual(401);
    });
  });

  describe('post /v1/auth/logout', () => {
    beforeEach(async () => {
      await insertUser('customer1');
      const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
      await tokenService.saveToken({ token: customer1RefreshToken, expires, type: 'refresh', userId: customer1._id });
    });

    test('should return 204 with correct bearer authorization token. refresh_token must be removed from db', async () => {
      const { body } = await request(app).post('/v1/auth/logout')
        .send({ refreshToken: customer1RefreshToken })
        .expect(204);
      expect(body).toEqual({});
    });

    test('should return 401 for bad refresh token', async () => {
      const { body } = await request(app).post('/v1/auth/logout').send({ refreshToken: customer1AccessToken }).expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 400 for extra params', async () => {
      const { body } = await request(app).post('/v1/auth/logout')
        .send({ refreshToken: customer1RefreshToken, extra: 'extra' })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 without refreshToken', async () => {
      const { body } = await request(app).post('/v1/auth/logout').send({}).expect(400);
      expect(body.code).toEqual(400);
    });

  });

  describe('post /v1/auth/refresh-tokens', () => {
    let tokenDoc;
    beforeEach(async () => {
      await insertUser('customer1');
      const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
      tokenDoc = await tokenService.saveToken({ token: customer1RefreshToken, expires, type: 'refresh', userId: customer1._id });
    });

    test('should return 200 for correct refresh token. Response must have token data and user data. Old token must be deleted from db', async () => {
      const { body } = await request(app).post('/v1/auth/refresh-tokens')
        .send({ refreshToken: customer1RefreshToken })
        .expect(200);

      expect(body.user).not.toHaveProperty('password');
      expect(body.user).toEqual({ ...customer1, password: undefined, _id: expect.anything() });
      expect(body.tokens.access).toEqual({ token: expect.anything(), expires: expect.anything() });
      expect(body.tokens.refresh).toEqual({ token: expect.anything(), expires: expect.anything() });

      let oldTokenDoc = await Token.findById(tokenDoc._id);
      expect(oldTokenDoc).toBeFalsy();
    });

    test('should return 401 for bad refresh token', async () => {
      const { body } = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken: customer1AccessToken }).expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 400 for extra params', async () => {
      const { body } = await request(app).post('/v1/auth/refresh-tokens')
        .send({ refreshToken: customer1RefreshToken, extra: 'extra' })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 without refreshToken', async () => {
      const { body } = await request(app).post('/v1/auth/refresh-tokens').send({}).expect(400);
      expect(body.code).toEqual(400);
    });
  });
});