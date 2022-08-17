const reviewService = require('./review.service');
const Restaurant = require('../db/models/Restaurant.model');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { round } = require('../utils/math');
const { convertMongooseSortToObject } = require('../utils/arrays');

let restaurantService = {};


/**
 * Get restaurant by id. Throws if not found
 * @param {number} id - id of the restaurant
 * @returns {Promise<Restaurant>}
 */
restaurantService.selectByIdThrowIfNotFound = async (id) => {
  let restaurant = await Restaurant.findById(id).lean();
  if (!restaurant) throw new NotFoundError('Restaurant not found');
  return restaurant;
}

/**
 * Creates new restaurant
 * @param {Restaurant} restaurantBody
 * @returns {Promise<Restaurant>} - Newly created restaurant
 */
restaurantService.createNew = async (restaurantBody) => {
  if (!(await restaurantService.isNameAvailable(restaurantBody.name))) {
    throw new BadRequestError('Name is already taken');
  }
  let restaurant = new Restaurant(restaurantBody);
  await restaurant.save();
  return Restaurant.findById(restaurant._id).lean();
}

/**
 * Update restaurant
 * @param {number} id - id of the restaurant
 * @param {Restaurant} restaurantBody
 * @returns {Promise<Restaurant>} - updated restaurant
 */
restaurantService.updateById = async (id, restaurantBody) => {
  if (!(await restaurantService.isNameAvailable(restaurantBody.name, id))) {
    throw new BadRequestError('Name is already taken');
  }
  return await Restaurant.findOneAndUpdate({ _id: id }, restaurantBody, { new: true })
    .lean();
}


/**
 * mongoose-paginate-v2. Basically its mongoose.find wrapped with pagination. Returns total and page counts.
 * @param {Object} query mongoose query object
 * @param {Object} [options] mongoose-paginate-v2 options (sort, select, populate, )
 * @param {number} [options.page] page number (default 1)
 * @param {number} [options.limit] page size (default 10)
 * @param {Object | string} [options.select] mongoose select
 * @param {Object | string} [options.sort] mongoose sort
 * @param {Array | Object | string} [options.populate] mongoose populate
 * @returns {Array<Object>} Array of restaurants
 */
restaurantService.selectWithPaging = async (query, options = {}) => {
  return await Restaurant.paginate2(query, options);
}

/**
 * Using aggregation pipeline to select avgRating and reviewCount per each selected restaurant. Supports regular mongoose query and paging options.
 * @param {Object} query mongoose query object
 * @param {Object} [options] mongoose-paginate-v2 options (sort, select, populate, )
 * @param {number} [options.page] page number (default 1)
 * @param {number} [options.limit] page size (default 10)
 * @param {Object | string} [options.select] mongoose select
 * @param {Object | string} [options.sort] mongoose sort
 * @param {Object | string} [options.afterAggregationQuery] query for the later stage of the aggregation pipeline to filter aggregated average and/or count
 * @returns {Array<Object>} Array of restaurants with .avgRating and .reviewCount
 */
restaurantService.selectWithAvgRatingAndPaginate = async (query, { page = 1, limit = 10, sort = '-createdAt', afterAggregationQuery = {} } = {}) => {
  let sortObj = convertMongooseSortToObject(sort);
  if (query.$text) sortObj.score = { $meta: "textScore" };

  let r = Restaurant.aggregate([
    { $match: query, },
    {
      $lookup: {
        from: 'reviews',
        let: { restaurantId: '$_id' },
        as: 'reviews',
        pipeline: [
          {
            $match: { $expr: { $eq: ['$$restaurantId', '$restaurant'] } }
          },
          {
            $group: {
              _id: '$restaurant',
              avgRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 },
              pendingReviewCount: { $sum: { $cond: { if: { $gt: ['$reply', null] }, then: 0, else: 1 } } },
            }
          },
          {
            $project: { _id: false }
          }
        ]
      }
    },
    {
      $unwind: {
        path: '$reviews',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        avgRating: { $ifNull: ['$reviews.avgRating', 0] },
        reviewCount: { $ifNull: ['$reviews.reviewCount', 0] },
        pendingReviewCount: { $ifNull: ['$reviews.pendingReviewCount', 0] },
        createdAt: true,
        _id: true,
        name: true,
        address: true,
        user: true,
        picUrl: true,
        distance: true,
      }
    },
    // { $project: { reviews: false, } },
    { $sort: sortObj, },
    { $match: afterAggregationQuery, },
    { // Branch out to 2 separate pipelines, one to deliver results with paging, the other to preserve total doc count
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        docCountResultArray: [{ $count: 'docCount' }]
      }
    }
  ]);

  let result = await r.exec();
  let [{ items, docCountResultArray }] = result;
  let totalItems = docCountResultArray[0]?.docCount || 0;

  items = items.map(e => {
    e.avgRating = round(e.avgRating, 2);
    return e;
  });

  let totalPages = Math.ceil(totalItems / limit);
  return {
    totalItems,
    items,
    totalPages,
    pageNumber: page,
    pageSize: limit,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages
  };
}

/**
 * Delete restaurant
 * @param {number} id - id of the restaurant
 */
restaurantService.deleteById = async (id) => {
  await Restaurant.deleteOne({ _id: id });
}

/**
 * Makes sure name isn't already taken
 * @param {string} name name to check
 * @param {number} excludeId id to exclude
 * @returns {Promise<boolean>}
 */
restaurantService.isNameAvailable = async (name, excludeId) => {
  let r = await Restaurant.findOne({ name, _id: { $ne: excludeId } });
  return !r;
}

/**
 * Selects all restaurants that belong to an owner. Includes a number of pending reviews on each.
 * @param {numb} ownerId id of the restaurant owner
 * @returns {Promise<Array<Object>>} Array of restaurants
 */
restaurantService.selectOwnRestaurantsWithPendingReviewCounts = async (ownerId) => {
  let result = await restaurantService.selectWithAvgRatingAndPaginate({ user: ownerId });
  if (!(result.items && result.items.length)) {
    return result;
  }

  let pendingReviews = await reviewService.selectPendingReviewsByRestaurantIds(result.items.map(e => e._id));
  let pendingReviewCountMap = new Map();
  if (pendingReviews && pendingReviews.length) {
    for (let pr of pendingReviews) {
      pendingReviewCountMap.set(pr.restaurant, (pendingReviewCountMap.get(pr.restaurant) || 0) + 1);
    }
  }

  result.items = result.items.map(e => {
    e.pendingReviewCount = pendingReviewCountMap.get(e._id);
    return e;
  });
  return result;
}


module.exports = restaurantService;