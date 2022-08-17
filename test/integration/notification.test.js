const { dbSetupAndTearDown } = require('../utils/setupTestDB');
const { customer1, customer2, owner1, owner2, admin, insertOneUser, insertAllUsers } = require('../fixtures/user.fixture');
const { customer1AccessToken, customer2AccessToken, adminAccessToken, owner1AccessToken, owner2AccessToken, customer1RefreshToken } = require('../fixtures/token.fixture');
const { insertAllRestaurants, owner1Restaurant1, owner1Restaurant2, owner2Restaurant1 } = require('../fixtures/restaurant.fixture');
const { review1OfRestaurant1, review2OfRestaurant1, review1OfRestaurant2, insertReview, insertAllReviews } = require('../fixtures/review.fixture');
const { insertNotif, insertAllNotifs, newReviewNotif1, newReviewNotif2, newReplyNotif1, newReplyNotif2, newReplyNotif3, newReviewNotif3 } = require('../fixtures/notification.fixture');
const { selectWithPaging } = require('../../src/services/notification.service');

const request = require('supertest');
const app = require('../../src/app');

dbSetupAndTearDown(['users', 'restaurants', 'reviews']);
beforeAll(async () => {
  await insertAllUsers();
  await insertAllRestaurants();
  await insertAllReviews()
});

describe('[Notifications]', () => {
  describe('get /v1/notifications/own', () => {
    test('should return 200 with only own data (len = 2) for customer. Response should NOT have seenDate. Notifs in DB also should not have seenDate set.', async () => {
      await insertAllNotifs(); // 2 for owner1 2 for customer1, 1 for owner2, 1 for customer2
      const { body } = await request(app).get('/v1/notifications/own')
        .query({ pageSize: 10, pageNumber: 1 })
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(200);
      expect(body).toEqual({
        items: expect.anything(),
        totalItems: 2,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 10,
        hasPrevPage: false,
        hasNextPage: false,
      });
      expect(body.items).toHaveLength(2);
      expect(body.items).toContainEqual({ ...newReplyNotif1, review: expect.anything(), createdAt: expect.anything(), });
      expect(body.items).toContainEqual({ ...newReplyNotif2, review: expect.anything(), createdAt: expect.anything(), });

      let { items: customer1NotifsFromDb } = await selectWithPaging({ user: customer1._id }, { sort: '-createdAt' });
      expect(customer1NotifsFromDb.every(e => !e.seenDate)).toBeTruthy();

      let { items: customer2NotifsFromDb } = await selectWithPaging({ user: customer2._id }, { sort: '-createdAt' });
      expect(customer2NotifsFromDb.every(e => !e.seenDate)).toBeTruthy();
    });

    test('should return 200 with only own data (len = 1) for owner with same checks on seenDate as above. Also paging properties should be correct', async () => {
      await insertAllNotifs(); // 2 for owner1 2 for customer1, 1 for owner2, 1 for customer2
      const { body } = await request(app).get('/v1/notifications/own').set('Authorization', `Bearer ${owner2AccessToken}`)
        .expect(200);
      expect(body).toEqual({
        items: expect.anything(),
        totalItems: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 10,
        hasPrevPage: false,
        hasNextPage: false,
      });
      expect(body.items).toHaveLength(1);
      expect(body.items).toContainEqual({ ...newReviewNotif3, review: expect.anything(), createdAt: expect.anything(), });

      let { items: owner2NotifsFromDb } = await selectWithPaging({ user: owner2._id }, { sort: '-createdAt' });
      expect(owner2NotifsFromDb.every(e => !e.seenDate)).toBeTruthy();

      let { items: owner1NotifsFromDb } = await selectWithPaging({ user: owner1._id }, { sort: '-createdAt' });
      expect(owner1NotifsFromDb.every(e => !e.seenDate)).toBeTruthy();
    });

    test('should return 200 and correct page size', async () => {
      await insertAllNotifs(); // 2 for owner1 2 for customer1, 1 for owner2, 1 for customer2
      const { body } = await request(app).get('/v1/notifications/own')
        .query({ pageSize: 1, pageNumber: 1 })
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(200);
      expect(body).toEqual({
        items: expect.anything(),
        totalItems: 2,
        totalPages: 2,
        pageNumber: 1,
        pageSize: 1,
        hasPrevPage: false,
        hasNextPage: true,
      });
      expect(body.items).toHaveLength(1);
    });

    test('should return 404 if no own notifs present', async () => {
      await insertAllNotifs(); // 2 for owner1 2 for customer1, 1 for owner2, 1 for customer2
      const { body } = await request(app).get('/v1/notifications/own').set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 401 for bad token', async () => {
      await insertAllNotifs(); // 2 for owner1 2 for customer1, 1 for owner2, 1 for customer2
      const { body } = await request(app).get('/v1/notifications/own').set('Authorization', `Bearer ${123}`)
        .expect(401);
      expect(body.code).toEqual(401);
    });
  });

  describe('patch /v1/notifications/own', () => {
    test('should return 204 and Notifs in DB SHOULD have seenDate set. Notifs of others should NOT have seenDate set.', async () => {
      await insertAllNotifs(); // 2 for owner1 2 for customer1, 1 for owner2, 1 for customer2
      const { body } = await request(app).patch('/v1/notifications/own')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(204);
      expect(body).toEqual({});

      let { items: customer1NotifsFromDb } = await selectWithPaging({ user: customer1._id }, { sort: '-createdAt' });
      expect(customer1NotifsFromDb.every(e => e.seenDate)).toBeTruthy();

      let { items: customer2NotifsFromDb } = await selectWithPaging({ user: customer2._id }, { sort: '-createdAt' });
      expect(customer2NotifsFromDb.every(e => !e.seenDate)).toBeTruthy();
    });

    test('should return 401 for bad token', async () => {
      await insertAllNotifs(); // 2 for owner1 2 for customer1, 1 for owner2, 1 for customer2
      const { body } = await request(app).patch('/v1/notifications/own').set('Authorization', `Bearer ${customer1RefreshToken}`)
        .expect(401);
      expect(body.code).toEqual(401);
    });
  });
});
