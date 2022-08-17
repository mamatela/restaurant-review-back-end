const Review = require('../../src/db/models/Review.model');
const { owner1, owner2, customer1, customer2 } = require('./user.fixture');
const { owner1Restaurant1, owner1Restaurant2, owner2Restaurant1 } = require('./restaurant.fixture');

let lib = {};

let review1OfRestaurant1 = {
  _id: 1,
  restaurant: owner1Restaurant1._id,
  user: customer1._id,
  rating: 1,
  comment: 'comment',
};

let review2OfRestaurant1 = {
  _id: 2,
  restaurant: owner1Restaurant1._id,
  user: customer2._id,
  rating: 5,
  comment: 'comment',
};

let review1OfRestaurant2 = {
  _id: 3,
  restaurant: owner1Restaurant2._id,
  user: customer1._id,
  rating: 4,
  comment: 'comment',
};

let review2OfRestaurant2 = {
  _id: 4,
  restaurant: owner1Restaurant2._id,
  user: customer2._id,
  rating: 3,
  comment: 'comment',
};

let insertReview = async (review) => {
  await Review.create(review);
};

/**
 * Updates review
 * @param {number} id id of the reveiw
 * @param {Object} review update object
 */
let updateReviewById = async (id, review) => {
  await Review.findByIdAndUpdate(id, review);
};

let insertAllReviews = async () => {
  await Promise.all([
    insertReview(review1OfRestaurant1), 
    insertReview(review2OfRestaurant1), 
    insertReview(review1OfRestaurant2), 
    insertReview(review2OfRestaurant2)
  ]);
}

module.exports = {
  review1OfRestaurant1,
  review2OfRestaurant1,
  review1OfRestaurant2,
  review2OfRestaurant2,
  insertReview,
  insertAllReviews,
  updateReviewById,
}