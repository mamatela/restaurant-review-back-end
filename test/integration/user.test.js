const { dbSetupAndTearDown } = require('../utils/setupTestDB');
const { customer1, customer2, owner1, owner2, admin, insertUser } = require('../fixtures/user.fixture');
const { customer1AccessToken, customer2AccessToken, adminAccessToken } = require('../fixtures/token.fixture');

const request = require('supertest');
const app = require('../../src/app');

dbSetupAndTearDown();

describe('[Users]', () => {
  let newUser;
  describe('post /v1/users', () => {
    beforeEach(() => {
      newUser = {
        email: 'customer@example.com',
        firstName: 'customer',
        lastName: 'customer',
        role: 'customer',
        password: 'string123'
      }
    });

    test('should return 201 for correct input. Response should have new user data without password', async () => {
      await insertUser('admin');
      let { body } = await request(app).post('/v1/users').set('Authorization', `Bearer ${adminAccessToken}`).send(newUser).expect(201);
      expect(body).not.toHaveProperty('password');
      delete newUser.password;
      expect(body).toEqual({ ...newUser, _id: expect.anything() });
    });

    test('should return 401 for bad token', async () => {
      await insertUser('admin');
      await insertUser('customer1');
      const { body } = await request(app).post('/v1/users').set('Authorization', `Bearer ${customer2AccessToken}`).expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 403 for non-admin', async () => {
      await insertUser('admin');
      await insertUser('customer1');
      const { body } = await request(app).post('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`).expect(403);
      expect(body.code).toEqual(403);
    });

    test('should return 400 for extra fields', async () => {
      await insertUser('admin');
      newUser.extra = 'extra';
      let { body } = await request(app).post('/v1/users').set('Authorization', `Bearer ${adminAccessToken}`).send(newUser).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 for missing required fields', async () => {
      await insertUser('admin');
      delete newUser.email;
      let { body } = await request(app).post('/v1/users').set('Authorization', `Bearer ${adminAccessToken}`).send(newUser).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 for bad password', async () => {
      await insertUser('admin');
      newUser.password = 'string';
      let { body } = await request(app).post('/v1/users').set('Authorization', `Bearer ${adminAccessToken}`).send(newUser).expect(400);
      expect(body.code).toEqual(400);
    });
  });

  describe('patch /v1/users', () => {
    let fullUpdateBody;
    beforeEach(() => {
      fullUpdateBody = {
        email: 'updated@example.com',
        firstName: 'udpate',
        lastName: 'updated',
        role: 'customer',
        password: 'string123'
      }
    });

    test('should return 200 with correct data for correct input', async () => {
      await insertUser('customer1');
      const { email, firstName, lastName } = fullUpdateBody;
      const { body } = await request(app).patch('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: customer1._id })
        .send({ email, firstName, lastName }).expect(200);
      delete fullUpdateBody.password;
      expect(body).toEqual({ ...fullUpdateBody, _id: expect.anything() });
    });

    test('should return 404 for non-existing user', async () => {
      await insertUser('customer1');
      const { body } = await request(app).patch('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: -1 })
        .send({}).expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 400 for extra fields', async () => {
      await insertUser('customer1');
      const { body } = await request(app).patch('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: customer1._id })
        .send({ extra: 'extra' }).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 403 for attempting to include "password" in body as non-admin', async () => {
      await insertUser('customer1');
      const { body } = await request(app).patch('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: customer1._id })
        .send({ password: 'string123' }).expect(403);
      expect(body.code).toEqual(403);
    });

    test('should return 400 if changing email to already existing one on another user', async () => {
      await insertUser('customer1');
      await insertUser('customer2');
      const { body } = await request(app).patch('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: customer1._id })
        .send({ email: customer2.email }).expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 200 if changing email with the same one (that user currently has)', async () => {
      await insertUser('customer1');
      const { body } = await request(app).patch('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: customer1._id })
        .send({ email: customer1.email }).expect(200);
    });

    test('should return 401 with bad token', async () => {
      await insertUser('customer1');
      const { body } = await request(app).patch('/v1/users').set('Authorization', `Bearer ${customer2AccessToken}`)
        .query({ _id: customer1._id })
        .send({}).expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 404 when attempting to upgrade someone else\'s data', async () => {
      await insertUser('customer1');
      await insertUser('customer2');
      const { body } = await request(app).patch('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: customer2._id })
        .send({}).expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 200 when updating someone else\'s data as admin', async () => {
      await insertUser('customer1');
      await insertUser('customer2');
      await insertUser('admin');
      const { body } = await request(app).patch('/v1/users').set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ _id: customer2._id })
        .send({ firstName: 'updated' }).expect(200);
      expect(body.firstName).toEqual('updated');
    });
  });

  describe('get /v1/users', () => {
    test('should return 200 with user data for correct input', async () => {
      await insertUser('customer1');
      const { body } = await request(app).get('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: customer1._id })
        .expect(200);
      expect(body).toEqual({ ...customer1, password: undefined });
    });

    test('should return 401 for bad token', async () => {
      await insertUser('customer1');
      const { body } = await request(app).get('/v1/users').set('Authorization', `Bearer ${customer2AccessToken}`)
        .query({ _id: customer1._id })
        .expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 404 for not-own userId', async () => {
      await insertUser('customer1');
      const { body } = await request(app).get('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: customer2._id })
        .expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 200 for not-own userId for admin', async () => {
      await insertUser('customer1');
      await insertUser('admin');
      const { body } = await request(app).get('/v1/users').set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ _id: customer1._id })
        .expect(200);
      expect(body).toEqual({ ...customer1, password: undefined });
    });
  });

  describe('delete /v1/users', () => {
    test('should return 204 for correct input', async () => {
      await insertUser('customer1');
      await insertUser('admin');
      const { body } = await request(app).delete('/v1/users').set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ _id: customer1._id })
        .expect(204);
      expect(body).toEqual({});
    });

    test('should return 401 for bad token', async () => {
      await insertUser('customer1');
      await insertUser('admin');
      const { body } = await request(app).delete('/v1/users').set('Authorization', `Bearer ${123}`)
        .query({ _id: customer1._id })
        .expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 403 for non-admin', async () => {
      await insertUser('customer1');
      await insertUser('admin');
      const { body } = await request(app).delete('/v1/users').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: customer1._id })
        .expect(403);
      expect(body.code).toEqual(403);
    });

    test('should return 404 for non-existing user id', async () => {
      await insertUser('customer1');
      await insertUser('admin');
      const { body } = await request(app).delete('/v1/users').set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ _id: customer2._id })
        .expect(404);
      expect(body.code).toEqual(404);
    });
  });

  describe('get /v1/users/all', () => {
    test('should get 200 with a list for correct input', async () => {
      await insertUser('customer1');
      await insertUser('customer2');
      await insertUser('admin');
      const { body } = await request(app).get('/v1/users/all').set('Authorization', `Bearer ${adminAccessToken}`).expect(200);
      expect(body.totalItems).toEqual(3);
      expect(body.totalPages).toEqual(1);
      expect(body.pageNumber).toEqual(1);
      expect(body.pageSize).toEqual(10);
      expect(body.hasPrevPage).toEqual(false);
      expect(body.hasNextPage).toEqual(false);
      expect(body.items).toHaveLength(3);
      expect(body.items).toContainEqual({ ...customer1, password: undefined });
      expect(body.items).toContainEqual({ ...customer2, password: undefined });
      expect(body.items).toContainEqual({ ...admin, password: undefined });
    });

    test('should get 401 with bad token', async () => {
      const { body } = await request(app).get('/v1/users/all').set('Authorization', `Bearer ${123}`).expect(401);
    });

    test('should get 403 with non-admin token', async () => {
      await insertUser('admin');
      await insertUser('customer1');
      const { body } = await request(app).get('/v1/users/all').set('Authorization', `Bearer ${customer1AccessToken}`).expect(403);
      expect(body.code).toEqual(403);
    });

    test('should get 200 with correct paging data with query.pageSize=2. Also expect correct order', async () => {
      await insertUser('customer1');
      await insertUser('customer2');
      await insertUser('owner1');
      await insertUser('owner2');
      await insertUser('admin');
      const { body } = await request(app).get('/v1/users/all').set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ pageSize: 2 })
        .expect(200);
      expect(body.totalItems).toEqual(5);
      expect(body.totalPages).toEqual(3);
      expect(body.pageNumber).toEqual(1);
      expect(body.pageSize).toEqual(2);
      expect(body.hasPrevPage).toEqual(false);
      expect(body.hasNextPage).toEqual(true);
      expect(body.items).toHaveLength(2);
      expect(body.items).toContainEqual({ ...owner2, password: undefined });
      expect(body.items).toContainEqual({ ...admin, password: undefined });
    });
  });
});
