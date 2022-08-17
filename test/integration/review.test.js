const { dbSetupAndTearDown } = require('../utils/setupTestDB');
const { customer1, customer2, owner1, owner2, admin, insertOneUser, insertAllUsers } = require('../fixtures/user.fixture');
const { customer1AccessToken, customer2AccessToken, adminAccessToken, owner1AccessToken, owner2AccessToken } = require('../fixtures/token.fixture');
const { insertAllRestaurants, owner1Restaurant1, owner1Restaurant2, owner2Restaurant1 } = require('../fixtures/restaurant.fixture');
const { review1OfRestaurant1, review2OfRestaurant1, review1OfRestaurant2, insertReview, insertAllReviews } = require('../fixtures/review.fixture');
const { selectWithPaging } = require('../../src/services/notification.service');

const request = require('supertest');
const app = require('../../src/app');

dbSetupAndTearDown(['users', 'restaurants']);
beforeAll(async () => {
  await insertAllUsers();
  await insertAllRestaurants();
})

describe('[Reviews]', () => {

  let newReview;
  beforeEach(() => {
    newReview = {
      restaurant: owner1Restaurant1._id,
      rating: 5,
      comment: 'string'
    }
  });
  describe('post /v1/reviews', () => {
    test('should return 201 and correct data for correct input. Make sure notif got created', async () => {
      const { body } = await request(app).post('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .send(newReview)
        .expect(201);
      expect(body).toEqual({ ...newReview, _id: expect.anything(), date: expect.anything(), user: customer1._id });
      let { items } = await selectWithPaging({ user: owner1Restaurant1.user });
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveProperty('type', 'new_review');
      expect(items[0]).toHaveProperty('review', expect.anything());
      expect(items[0]).toHaveProperty('navUrl', `/restaurants?_id=${newReview.restaurant}`);
    });

    test('should return 401 for bad token', async () => {
      const { body } = await request(app).post('/v1/reviews').set('Authorization', `Bearer ${123}`).expect(401)
      expect(body.code).toEqual(401);
    });

    test('should return 403 for owner', async () => {
      const { body } = await request(app).post('/v1/reviews').set('Authorization', `Bearer ${owner1AccessToken}`).expect(403)
      expect(body.code).toEqual(403);
    });

    test('should return 400 for extra params', async () => {
      const { body } = await request(app).post('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({ ...newReview, extra: 'extra' })
        .expect(400)
      expect(body.code).toEqual(400);
    });

    test('should return 400 for missing required param', async () => {
      const { body } = await request(app).post('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({ ...newReview, rating: undefined })
        .expect(400)
      expect(body.code).toEqual(400);
    });

    test('should return 404 if adding review of a non-existing restaurant', async () => {
      const { body } = await request(app).post('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({ ...newReview, restaurant: 100 })
        .expect(404)
      expect(body.code).toEqual(404);
    });
  });

  let updateBody;
  beforeEach(() => {
    updateBody = {
      rating: 3,
      comment: 'string2'
    }
  });
  describe('patch /v1/reviews', () => {
    test('should return 200 for correct input', async () => {
      await insertReview(review1OfRestaurant1);
      const { body } = await request(app).patch('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: review1OfRestaurant1._id })
        .send({ ...updateBody })
        .expect(200);
      expect(body).toEqual({
        ...updateBody,
        _id: expect.anything(),
        date: expect.anything(),
        user: customer1._id,
        restaurant: review1OfRestaurant1._id
      });
    });
    test('should return 400 for adding restaurant', async () => {
      await insertReview(review1OfRestaurant1);
      const { body } = await request(app).patch('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: review1OfRestaurant1._id })
        .send({ ...updateBody, restaurant: 100 })
        .expect(400);
      expect(body.code).toEqual(400);
    });
    test('should return 400 for missing query._id', async () => {
      await insertReview(review1OfRestaurant1);
      const { body } = await request(app).patch('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({ ...updateBody })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 for extra input', async () => {
      await insertReview(review1OfRestaurant1);
      const { body } = await request(app).patch('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: review1OfRestaurant1._id })
        .send({ ...updateBody, extra: 'extra' })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 401 for bad token', async () => {
      await insertReview(review1OfRestaurant1);
      const { body } = await request(app).patch('/v1/reviews').set('Authorization', `Bearer ${123}`)
        .query({ _id: review1OfRestaurant1._id })
        .send(updateBody)
        .expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 403 for owner token', async () => {
      await insertReview(review1OfRestaurant1);
      const { body } = await request(app).patch('/v1/reviews').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ _id: review1OfRestaurant1._id })
        .send(updateBody)
        .expect(403);
      expect(body.code).toEqual(403);
    });

    test('should return 404 for non-own review', async () => {
      await insertReview(review1OfRestaurant1);
      const { body } = await request(app).patch('/v1/reviews').set('Authorization', `Bearer ${customer2AccessToken}`)
        .query({ _id: review1OfRestaurant1._id })
        .send(updateBody)
        .expect(404);
      expect(body.code).toEqual(404);
    });
  });

  describe('delete /v1/reviews', () => {
    beforeEach(async () => {
      await insertReview(review1OfRestaurant1);
    });
    test('should return 204 for correct input', async () => {
      const { body } = await request(app).delete('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: review1OfRestaurant1._id })
        .expect(204);
    });

    test('should return 404 for non-existing', async () => {
      const { body } = await request(app).delete('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ _id: 100 })
        .expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 401 for bad token', async () => {
      const { body } = await request(app).delete('/v1/reviews').set('Authorization', `Bearer ${123}`)
        .query({ _id: 100 })
        .expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 400 without query._id', async () => {
      const { body } = await request(app).delete('/v1/reviews').set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 404 when deleting not-own review', async () => {
      const { body } = await request(app).delete('/v1/reviews').set('Authorization', `Bearer ${customer2AccessToken}`)
        .query({ _id: review1OfRestaurant1._id })
        .expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 403 for owner-type user', async () => {
      const { body } = await request(app).delete('/v1/reviews').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ _id: review1OfRestaurant1._id })
        .expect(403);
      expect(body.code).toEqual(403);
    });
  });

  describe('get /v1/reviews/by-restaurant', () => {
    beforeEach(async () => {
      await insertAllReviews();
    });
    test('', async () => {
      const { body } = await request(app).get('/v1/reviews/by-restaurant').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ restaurantId: owner1Restaurant1._id })
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
      expect(body.items).toContainEqual({ ...review1OfRestaurant1, user: expect.anything(), date: expect.anything(), });
      expect(body.items).toContainEqual({ ...review2OfRestaurant1, user: expect.anything(), date: expect.anything(), });
    });

    test('should return 400 without query.restaurantId', async () => {
      const { body } = await request(app).get('/v1/reviews/by-restaurant').set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 with extra query field', async () => {
      const { body } = await request(app).get('/v1/reviews/by-restaurant').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ restaurantId: owner1Restaurant1._id, extra: 'extra' })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 404 if no data exists', async () => {
      const { body } = await request(app).get('/v1/reviews/by-restaurant').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ restaurantId: 100 })
        .expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 401 for bad token', async () => {
      const { body } = await request(app).get('/v1/reviews/by-restaurant').set('Authorization', `Bearer ${123}`)
        .query({ restaurantId: owner1Restaurant1._id })
        .expect(401);
      expect(body.code).toEqual(401);
    });
  });

  describe('post /v1/reviews/reply', () => {
    let reply = 'reply1';
    test('should return 201 for correct input. New notif must have been created', async () => {
      await insertAllReviews();
      const { body } = await request(app).post('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply })
        .expect(201);
      expect(body).toEqual({
        ...review1OfRestaurant1,
        date: expect.anything(),
        reply,
        replyDate: expect.anything()
      });
      let { items } = await selectWithPaging({ user: customer1._id });
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveProperty('type', 'new_reply');
      expect(items[0]).toHaveProperty('review', expect.anything());
      expect(items[0]).toHaveProperty('navUrl', `/restaurants?_id=${review1OfRestaurant1.restaurant}`);
    });

    test('should return 400 without query.reviewId', async () => {
      await insertAllReviews();
      const { body } = await request(app).post('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .send({ reply })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 without required body param', async () => {
      await insertAllReviews();
      const { body } = await request(app).post('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({})
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 with extra query param', async () => {
      await insertAllReviews();
      const { body } = await request(app).post('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id, extra: 'extra' })
        .send({ reply })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 with extra body param', async () => {
      await insertAllReviews();
      const { body } = await request(app).post('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply, extra: 'extra' })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 401 for bad token', async () => {
      await insertAllReviews();
      const { body } = await request(app).post('/v1/reviews/reply').set('Authorization', `Bearer ${123}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply })
        .expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 403 for customer', async () => {
      await insertAllReviews();
      const { body } = await request(app).post('/v1/reviews/reply').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply })
        .expect(403);
      expect(body.code).toEqual(403);
    });

    test('should return 404 for non-existing review', async () => {
      await insertAllReviews();
      const { body } = await request(app).post('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: 100 })
        .send({ reply })
        .expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 404 for not-own restaurant review', async () => {
      await insertAllReviews();
      const { body } = await request(app).post('/v1/reviews/reply').set('Authorization', `Bearer ${owner2AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply })
        .expect(404);
      expect(body.code).toEqual(404);
    });

  });

  describe('patch /v1/reviews/reply', () => {
    let updatedReply = 'updated reply';

    test('should return 200 for correct input', async () => {
      await insertAllReviews();
      const { body } = await request(app).patch('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply: updatedReply })
        .expect(200);
      expect(body).toEqual({
        ...review1OfRestaurant1,
        date: expect.anything(),
        reply: updatedReply,
        replyDate: expect.anything()
      });

    });

    test('should return 400 without query.reviewId', async () => {
      await insertAllReviews();
      const { body } = await request(app).patch('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .send({ reply: updatedReply })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 without required body param', async () => {
      await insertAllReviews();
      const { body } = await request(app).patch('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({})
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 with extra query param', async () => {
      await insertAllReviews();
      const { body } = await request(app).patch('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id, extra: 'extra' })
        .send({ reply: updatedReply })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 with extra body param', async () => {
      await insertAllReviews();
      const { body } = await request(app).patch('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply: updatedReply, extra: 'extra' })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 401 for bad token', async () => {
      await insertAllReviews();
      const { body } = await request(app).patch('/v1/reviews/reply').set('Authorization', `Bearer ${123}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply: updatedReply })
        .expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 403 for customer', async () => {
      await insertAllReviews();
      const { body } = await request(app).patch('/v1/reviews/reply').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply: updatedReply })
        .expect(403);
      expect(body.code).toEqual(403);
    });

    test('should return 404 for non-existing review', async () => {
      await insertAllReviews();
      const { body } = await request(app).patch('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: 100 })
        .send({ reply: updatedReply })
        .expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 404 for not-own restaurant review', async () => {
      await insertAllReviews();
      const { body } = await request(app).patch('/v1/reviews/reply').set('Authorization', `Bearer ${owner2AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .send({ reply: updatedReply })
        .expect(404);
      expect(body.code).toEqual(404);
    });
  });

  describe('patch /v1/reviews/delete', () => {
    test('should return 204 for correct input', async () => {
      await insertAllReviews();
      const { body } = await request(app).delete('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .expect(204);
      expect(body).toEqual({});
    });

    test('should return 400 without query.reviewId', async () => {
      await insertAllReviews();
      const { body } = await request(app).delete('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 400 with extra query param', async () => {
      await insertAllReviews();
      const { body } = await request(app).delete('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id, extra: 'extra' })
        .expect(400);
      expect(body.code).toEqual(400);
    });

    test('should return 401 for bad token', async () => {
      await insertAllReviews();
      const { body } = await request(app).delete('/v1/reviews/reply').set('Authorization', `Bearer ${123}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .expect(401);
      expect(body.code).toEqual(401);
    });

    test('should return 403 for customer', async () => {
      await insertAllReviews();
      const { body } = await request(app).delete('/v1/reviews/reply').set('Authorization', `Bearer ${customer1AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .expect(403);
      expect(body.code).toEqual(403);
    });

    test('should return 404 for non-existing review', async () => {
      await insertAllReviews();
      const { body } = await request(app).delete('/v1/reviews/reply').set('Authorization', `Bearer ${owner1AccessToken}`)
        .query({ reviewId: 100 })
        .expect(404);
      expect(body.code).toEqual(404);
    });

    test('should return 404 for not-own restaurant review', async () => {
      await insertAllReviews();
      const { body } = await request(app).delete('/v1/reviews/reply').set('Authorization', `Bearer ${owner2AccessToken}`)
        .query({ reviewId: review1OfRestaurant1._id })
        .expect(404);
      expect(body.code).toEqual(404);
    });
  });
});