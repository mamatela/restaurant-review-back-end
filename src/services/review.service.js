
const Review = require('../db/models/Review.model');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { round } = require('../utils/math');

let reviewService = {};


/**
 * Get review by id. Throws if not found
 * @param {number} id - id of the review
 * @returns {Promise<Review>}
 */
reviewService.selectByIdThrowIfNotFound = async (id) => {
  let review = await Review.findById(id).lean();
  if (!review) throw new NotFoundError('Review not found');
  return review;
}

/**
 * Get review by id and populate the result with corresponding restaurant
 * @param {number} id - id of the review
 * @returns {Promise<Review>} Review
 */
reviewService.selectByIdPopulateRestaurantThrow404 = async (id) => {
  let review = await Review.findById(id).populate('restaurant').lean();
  if (!review) throw new NotFoundError('Review not found');
  return review;
}

/**
 * Creates new review
 * @param {Review} reviewBody
 * @returns {Promise<Review>} - Newly created review
 */
reviewService.createNew = async (reviewBody) => {
  let review = new Review(reviewBody);
  await review.save();
  return Review.findById(review._id).lean();
}

/**
 * Update review
 * @param {number} id - id of the review
 * @param {Review} updateBody update object
 * @returns {Promise<Review>} - updated review
 */
reviewService.updateById = async (id, updateBody) => {
  return await Review.findByIdAndUpdate(id, updateBody, { new: true })
    .lean();
}

/**
 * mongoose-paginate-v2. Basically its mongoose.find wrapped with pagination. Returns total and page counts. Forces .lean().
 * @param {Object} query mongoose query object
 * @param {Object} [options] mongoose-paginate-v2 options (sort, select, populate, )
 * @param {number} [options.page] page number (default 1)
 * @param {number} [options.limit] page size (default 10)
 * @param {Object | string} [options.select] mongoose select
 * @param {Object | string} [options.sort] mongoose sort
 * @param {Array | Object | string} [options.populate] mongoose populate
 */
reviewService.selectWithPaging = async (query, options = {}) => {
  return await Review.paginate2(query, options);
}

/**
 * Delete review
 * @param {number} id - id of the review
 */
reviewService.deleteById = async (id) => {
  await Review.deleteOne({ _id: id });
}

/**
 * Selects all pending (without reply) reviews for a list of restaurants
 * @param {Array<number>} restaurantIds array of restaurantIds
 * @returns {Promise<Array<Object>>} Array of reviews
 */
reviewService.selectPendingReviewsByRestaurantIds = async (restaurantIds) => {
  let reviews = await Review.find({ restaurant: { $in: restaurantIds }, reply: { $exists: false }, replyDate: { $exists: false } }).lean();
  return reviews || [];
}

/**
 * returns best and worst reviews of the restaurant
 * @param {number} restaurantId Id of restaurant
 * @param {number} userId Id of User
 * @returns {Object} { best, worst }
 */
reviewService.getBestWorstAndOwnReviews = async (restaurantId, userId) => {
  let best = await Review.find({ restaurant: restaurantId }).populate('user').sort('-rating').limit(1).lean();
  let worst = await Review.find({ restaurant: restaurantId }).populate('user').sort('rating').limit(1).lean();
  let own = await Review.findOne({ restaurant: restaurantId, user: userId }).populate('user').lean();
  return {
    bestReview: best && best[0],
    worstReview: worst && worst[0],
    ownReview: own || undefined
  };
}

/**
 * Returns X most recent reviews
 * @param {number} restaurantId Id of restaurant
 * @param {string} searchString string to match against comment or reply
 * @returns {Array<Object>} Array of X recent reviews
 */
reviewService.getRecentReviews = async (restaurantId, searchString) => {
  let query = {
    restaurant: restaurantId,
  };
  if (searchString) {
    query.$or = [
      { comment: new RegExp(searchString, 'i') },
      { reply: new RegExp(searchString, 'i') },
    ]
  }
  let reviews = await Review.find(query).populate('user').sort('-date').limit(5).lean();
  return reviews || [];
}



/**
 * Compute average rating for a restaurant
 * @param {number} restaurantId - id of the restaurant
 */
reviewService.getAverageRatingByRestaurantId = async (restaurantId) => {
  let reviews = await Review.find({ restaurant: restaurantId });
  if (!(reviews && reviews.length)) return {};
  return {
    avgRating: round(reviews.reduce((a, e) => a + e.rating, 0) / reviews.length, 2),
    reviewCount: reviews.length,
    pendingReviewCount: reviews.filter(e => !e.reply).length,
  };
}
module.exports = reviewService;