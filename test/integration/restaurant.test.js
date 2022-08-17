const { dbSetupAndTearDown } = require('../utils/setupTestDB');
const { customer1, customer2, owner1, owner2, admin, insertUser, insertAllUsers } = require('../fixtures/user.fixture');
const { customer1AccessToken, customer2AccessToken, adminAccessToken, owner1AccessToken, owner1RefreshToken, owner2AccessToken } = require('../fixtures/token.fixture');
const { owner1Restaurant1, owner1Restaurant2, owner2Restaurant1, insertRestaurant } = require('../fixtures/restaurant.fixture');
const { insertReview, review1OfRestaurant1, review2OfRestaurant1, review1OfRestaurant2, review2OfRestaurant2, insertAllReviews, updateReviewById } = require('../fixtures/review.fixture');

const request = require('supertest');
const app = require('../../src/app');
const Restaurant = require('../../src/db/models/Restaurant.model');
const Review = require('../../src/db/models/Review.model');

dbSetupAndTearDown(['users']);
beforeAll(async () => {
  await insertAllUsers();
})

describe('[Restaurants]', () => {

  describe('post /v1/restaurants', () => {
    let token, newRestaurant;

    const construct = () => {
      return request(app)
        .post('/v1/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .send(newRestaurant)
    }

    beforeEach(() => {
      token = owner1AccessToken;
      newRestaurant = {
        name: 'new restaurant',
        address: 'new-rest-address'
      };
    })

    test('should return 201 for valid input. Response should have correct structure', async () => {
      const { body } = await construct().expect(201);

      expect(body).toBeInstanceOf(Object);
      expect(body).toHaveProperty('_id', expect.anything());
      expect(body).toHaveProperty('user', owner1._id);
      expect(body).toHaveProperty('name', newRestaurant.name);
      expect(body).toHaveProperty('address', newRestaurant.address);
    });

    test('should return 201 for valid input with admin user', async () => {
      token = adminAccessToken;

      const { body } = await construct().expect(201);

      expect(body).toBeInstanceOf(Object);
      expect(body).toHaveProperty('_id', expect.anything());
      expect(body).toHaveProperty('user', admin._id);
      expect(body).toHaveProperty('name', newRestaurant.name);
      expect(body).toHaveProperty('address', newRestaurant.address);
    });

    // test('should return 400 for extra properties', async () => {
    //   newRestaurant.extra = 'extra';

    //   await construct().expect(400);
    // });

    test('should return 400 for missing required props', async () => {
      newRestaurant.name = undefined;

      await construct().expect(400);
    });

    test('should return 400 for same name restaurant', async () => {
      await insertRestaurant(owner1Restaurant1);
      newRestaurant = { ...owner1Restaurant1, user: undefined };

      await construct().expect(400);
    });

    test('should return 401 for bad token', async () => {
      token = 'asdasd';

      await construct().expect(401);
    });

    test('should return 403 for customer-user', async () => {
      token = customer1AccessToken;

      await construct().expect(403);
    });
  });



  describe('patch /v1/restaurants', () => {
    let token, queryParams, updateRestaurantBody;

    const construct = () => {
      return request(app)
        .patch('/v1/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .query(queryParams)
        .send(updateRestaurantBody)
    }

    beforeEach(async () => {
      await insertRestaurant(owner1Restaurant1);
      token = owner1AccessToken;
      queryParams = {
        _id: owner1Restaurant1._id
      };
      updateRestaurantBody = {
        name: 'new name',
        address: 'new address'
      };
    })

    test('should return 200 with just name', async () => {
      delete updateRestaurantBody.address;

      const { body } = await construct().expect(200);

      expect(body).toHaveProperty('_id', expect.anything());
      expect(body).toHaveProperty('name', updateRestaurantBody.name);
      expect(body).toHaveProperty('address', owner1Restaurant1.address);
    });

    test('should return 200 with just address', async () => {
      delete updateRestaurantBody.name;

      const { body } = await construct().expect(200);

      expect(body).toHaveProperty('_id', expect.anything());
      expect(body).toHaveProperty('name', owner1Restaurant1.name);
      expect(body).toHaveProperty('address', updateRestaurantBody.address);
    });

    test('should return 400 for extra props', async () => {
      updateRestaurantBody.extra = 'extra';

      await construct(400).expect(400);
    });

    test('should return 400 for missing query._id', async () => {
      queryParams = {};

      await construct().expect(400);
    });

    test('should return 200 for updating to same name', async () => {
      updateRestaurantBody.name = owner1Restaurant1.name;

      const { body } = await construct().expect(200);

      expect(body).toHaveProperty('_id', expect.anything());
      expect(body).toHaveProperty('name', updateRestaurantBody.name);
      expect(body).toHaveProperty('address', updateRestaurantBody.address);
    });

    test('should return 403 for customer-user', async () => {
      token = customer1AccessToken;

      await construct().expect(403);
    });

    test('should return 404 for non-existing restaurant', async () => {
      queryParams._id = owner1Restaurant2._id;

      await construct().expect(404);
    });

    test('should return 404 for someone else\'s restaurant', async () => {
      await insertRestaurant(owner2Restaurant1);
      queryParams._id = owner1Restaurant2._id;

      await construct().expect(404);
    });

    test('should return 200 for someone else\'s restaurant in case of admin', async () => {
      await insertRestaurant(owner2Restaurant1);
      token = adminAccessToken;
      queryParams._id = owner1Restaurant1._id;

      await construct().expect(200);
    });
  });



  describe('get /v1/restaurant details', () => {
    let token, queryParams;

    const construct = () => {
      return request(app)
        .get('/v1/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .query(queryParams)
    }

    beforeEach(async () => {
      await insertRestaurant(owner1Restaurant1);
      token = owner1AccessToken;
      queryParams = {
        _id: owner1Restaurant1._id
      };
    })

    test('should return 200 with the right structure for correct input', async () => {
      const { body } = await construct().expect(200);

      expect(body.restaurant).toBeInstanceOf(Object);
      expect(body.restaurant).toHaveProperty('_id', expect.anything());
      expect(body.restaurant).toHaveProperty('name', owner1Restaurant1.name);
      expect(body.restaurant).toHaveProperty('address', owner1Restaurant1.address);
      expect(body.recentReviews).toBeInstanceOf(Array);
    });

    test('should return 200 with best, worst and recent reviews and correct average rating', async () => {
      await insertReview(review1OfRestaurant1);
      await insertReview(review2OfRestaurant1);

      const { body } = await construct().expect(200);

      expect(body.restaurant).toBeInstanceOf(Object);
      expect(body.restaurant).toHaveProperty('avgRating', 3);
      expect(body.restaurant).toHaveProperty('reviewCount', 2);

      expect(body.worstReview).toBeInstanceOf(Object);
      expect(body.worstReview).toHaveProperty('_id', expect.anything());
      expect(body.worstReview).toHaveProperty('date', expect.anything());
      expect(body.worstReview).toHaveProperty('rating', review1OfRestaurant1.rating);
      expect(body.worstReview).toHaveProperty('comment', review1OfRestaurant1.comment);

      expect(body.bestReview).toBeInstanceOf(Object);
      expect(body.bestReview).toHaveProperty('_id', expect.anything());
      expect(body.bestReview).toHaveProperty('date', expect.anything());
      expect(body.bestReview).toHaveProperty('rating', review2OfRestaurant1.rating);
      expect(body.bestReview).toHaveProperty('comment', review2OfRestaurant1.comment);

      expect(body.recentReviews.find(e => e._id == review1OfRestaurant1._id)).toBeTruthy();
      expect(body.recentReviews.find(e => e._id == review2OfRestaurant1._id)).toBeTruthy();
    });

    test('should return 200 with customer token as well', async () => {
      await insertReview(review1OfRestaurant1);
      await insertReview(review2OfRestaurant1);
      token = customer1AccessToken;

      await construct().expect(200);
    });

    test('should return 400 for extra query params', async () => {
      queryParams.extra = 'extra';

      await construct().expect(400);
    });

    test('should return 400 for missing query._id', async () => {
      queryParams = {};

      await construct().expect(400);
    });

    test('should return 401 for bad token', async () => {
      token = owner1RefreshToken;

      await construct().expect(401);
    });
  });



  describe('delete /v1/restaurants', () => {
    let token, queryParams;

    const construct = () => {
      return request(app)
        .delete('/v1/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .query(queryParams);
    }

    beforeEach(async () => {
      await insertRestaurant(owner1Restaurant1);
      token = owner1AccessToken;
      queryParams = {
        _id: owner1Restaurant1._id
      };
    })

    test('should return 204 for correct input', async () => {
      const { body } = await construct().expect(204);
      expect(body).toEqual({});
    });

    test('should return 404 if for non-existing restaurant', async () => {
      queryParams = { _id: owner1Restaurant2._id };

      await construct().expect(404);
    });

    test('should return 400 for extra query param', async () => {
      queryParams.extra = 'extra';

      await construct().expect(400);
    });

    test('should return 400 for missing query._id', async () => {
      queryParams = {};

      await construct().expect(400);
    });


    test('should return 403 for customer-user', async () => {
      token = customer1AccessToken;

      await construct().expect(403);
    });

    test('should return 401 for bad token', async () => {
      token = owner1RefreshToken;

      await construct().expect(401);
    });

    test('should return 404 for someone else\'s restaurant', async () => {
      token = owner2AccessToken;

      await construct().expect(404);
    });

    test('should return 204 for someone else\'s restaurant in case of admin', async () => {
      token = adminAccessToken;

      await construct().expect(204);
    });

  });




  describe('get /v1/restaurants/all', () => {
    let token, queryParams;

    const construct = () => {
      return request(app)
        .get('/v1/restaurants/all')
        .set('Authorization', `Bearer ${token}`)
        .query(queryParams);
    }

    beforeEach(async () => {
      await Promise.all([
        insertRestaurant(owner1Restaurant1),
        insertRestaurant(owner1Restaurant2),
        insertRestaurant(owner2Restaurant1),
        insertAllReviews(), // 2 per each of 2 restaurants of owner 1. Expected average ratings are: 3 and 3.5
      ])
      token = customer1AccessToken;
      queryParams = {
        sort: '-avgRating'
      };
    })

    test('should return 200 without any params. Data should have right structure. Restaurants should include correct avgRating and reviewCount. Order must be correct.', async () => {
      const { body } = await construct().expect(200);

      expect(body).toEqual({
        items: expect.any(Array),
        totalItems: 3,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 10,
        hasPrevPage: false,
        hasNextPage: false,
      });
      expect(body.items).toHaveLength(3);
      expect(body.items.map(e => e.avgRating)).toEqual([3.5, 3, 0]); // correct order

      const restaurant1 = body.items.find(e => e._id == owner1Restaurant1._id);
      expect(restaurant1).toBeInstanceOf(Object);
      expect(restaurant1).toHaveProperty('avgRating', 3);
      expect(restaurant1).toHaveProperty('reviewCount', 2);
      expect(restaurant1).toHaveProperty('pendingReviewCount', 2);

      const restaurant2 = body.items.find(e => e._id == owner1Restaurant2._id);
      expect(restaurant2).toBeInstanceOf(Object);
      expect(restaurant2).toHaveProperty('avgRating', 3.5);
      expect(restaurant2).toHaveProperty('reviewCount', 2);
      expect(restaurant1).toHaveProperty('pendingReviewCount', 2);

      const restaurant3 = body.items.find(e => e._id == owner2Restaurant1._id);
      expect(restaurant3).toBeInstanceOf(Object);
      expect(restaurant3).toHaveProperty('name', owner2Restaurant1.name);
    });

    test('should return 200 and correct paging info with pageSize=2. Total count should still be the same.', async () => {
      queryParams.pageSize = 2 ;

      const { body } = await construct().expect(200);

      expect(body).toEqual({
        items: expect.any(Array),
        totalItems: 3,
        totalPages: 2,
        pageNumber: 1,
        pageSize: 2,
        hasPrevPage: false,
        hasNextPage: true,
      });
      expect(body.items).toHaveLength(2);
      expect(body.items.map(e => e.avgRating)).toEqual([3.5, 3]); // correct order

      const restaurant1 = body.items.find(e => e._id == owner1Restaurant1._id);
      expect(restaurant1).toBeInstanceOf(Object);
      expect(restaurant1).toHaveProperty('avgRating', 3);
      expect(restaurant1).toHaveProperty('reviewCount', 2);
      expect(restaurant1).toHaveProperty('pendingReviewCount', 2);

      const restaurant2 = body.items.find(e => e._id == owner1Restaurant2._id);
      expect(restaurant2).toBeInstanceOf(Object);
      expect(restaurant2).toHaveProperty('avgRating', 3.5);
      expect(restaurant2).toHaveProperty('reviewCount', 2);
      expect(restaurant1).toHaveProperty('pendingReviewCount', 2);
    });

    test('should return 200 and only 1 item with filter. Total count should also be 1. Also one less pending review', async () => {
      queryParams = { avgRating: 4 };
      await Review.findByIdAndUpdate(review1OfRestaurant2._id, { reply: 'string', replyDate: Date.now() });

      const { body } = await construct().expect(200);

      expect(body).toEqual({
        items: expect.any(Array),
        totalItems: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 10,
        hasPrevPage: false,
        hasNextPage: false,
      });
      expect(body.items).toHaveLength(1);

      const restaurant = body.items.find(e => e._id == owner1Restaurant2._id);
      expect(restaurant).toBeInstanceOf(Object);
      expect(restaurant).toHaveProperty('avgRating', 3.5);
      expect(restaurant).toHaveProperty('reviewCount', 2);
      expect(restaurant).toHaveProperty('pendingReviewCount', 1);
    });

    test('should return 404 if no data', async () => {
      await Restaurant.deleteMany({});

      await construct().expect(404);
    });

    test('should return 400 for extra query param', async () => {
      queryParams.extra = 'extra';

      await construct().expect(400);
    });

    test('should return 401 for bad token', async () => {
      token = owner1RefreshToken;

      await construct().expect(401);
    });
  });

  // describe('get /v1/restaurants/by-owner', () => {
  //   const prepareOwner1RestaurantsWithReviews = async () => {
  //     await Promise.all([
  //       insertRestaurant(owner1Restaurant1),
  //       insertRestaurant(owner1Restaurant2),
  //       insertAllReviews(), // 2 per each of 2 restaurants of owner 1. Expected average ratings are: 3 and 3.5
  //     ])
  //   }

  //   test('should return 200 with the right structure. Only own restaurants. Should also have pendingReviewCount', async () => {
  //     await prepareOwner1RestaurantsWithReviews();
  //     await insertRestaurant(owner2Restaurant1);
  //     await updateReviewById(review1OfRestaurant1._id, { reply: 'reply', replyDate: new Date() });
  //     let { body } = await request(app).get('/v1/restaurants/by-owner').set('Authorization', `Bearer ${owner1AccessToken}`)
  //       .expect(200);
  //     expect(body).toEqual({
  //       items: expect.anything(),
  //       totalItems: 2,
  //       totalPages: 1,
  //       pageNumber: 1,
  //       pageSize: 10,
  //       hasPrevPage: false,
  //       hasNextPage: false,
  //     });
  //     expect(body.items).toHaveLength(2);
  //     expect(body.items).toContainEqual({ ...owner1Restaurant2, avgRating: 3.5, reviewCount: 2, pendingReviewCount: 2 });
  //     expect(body.items).toContainEqual({ ...owner1Restaurant1, avgRating: 3, reviewCount: 2, pendingReviewCount: 1 });
  //   });

  //   test('should return 404 for owner without restaurants', async () => {
  //     await prepareOwner1RestaurantsWithReviews();
  //     let { body } = await request(app).get('/v1/restaurants/by-owner').set('Authorization', `Bearer ${owner2AccessToken}`).expect(404)
  //     expect(body.code).toEqual(404);
  //   });

  //   test('should return 401 for bad token', async () => {
  //     let { body } = await request(app).get('/v1/restaurants/by-owner').set('Authorization', `Bearer ${123}`).expect(401)
  //     expect(body.code).toEqual(401);
  //   });

  //   test('should return 403 for customer-token', async () => {
  //     let { body } = await request(app).get('/v1/restaurants/by-owner').set('Authorization', `Bearer ${customer1AccessToken}`).expect(403)
  //     expect(body.code).toEqual(403);
  //   });
  // })
});