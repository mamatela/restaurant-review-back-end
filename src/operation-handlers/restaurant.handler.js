const ahw = require('../utils/async-handler-wrapper');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { restaurantService, reviewService } = require('../services');
const config = require('../../config');

const lib = {};

lib.createRestaurant = ahw(async (req, res, next) => {
  req.body.user = req.user._id;
  let restaurant = await restaurantService.createNew(req.body);
  res.status(201).send(restaurant);
});


lib.createRestaurantWithPicture = ahw(async (req, res, next) => {
  if (!(req.files && req.files.length)) {
    throw new BadRequestError('Please upload a picture');
  }
  if (req.body.lat) req.body.lat = +req.body.lat;
  if (req.body.long) req.body.long = +req.body.long;
  if (req.body.distance) req.body.distance = +req.body.distance;
  req.body.user = req.user._id;
  req.body.picUrl = req.files[0].path.replace('static', '');
  let restaurant = await restaurantService.createNew(req.body);
  res.status(201).send(restaurant);
});


lib.editRestaurantWithPicture = ahw(async (req, res, next) => {
  let restaurant = await restaurantService.selectByIdThrowIfNotFound(req.query._id);
  if ((req.files && req.files.length)) {
    // @TODO Delete existing picture


    req.body.picUrl = req.files[0].path.replace('static', '');
  }
  if (req.body.lat) req.body.lat = +req.body.lat;
  if (req.body.long) req.body.long = +req.body.long;
  if (req.body.distance) req.body.distance = +req.body.distance;
  res.send(await restaurantService.updateById(restaurant._id, req.body));
});



lib.editRestaurantById = ahw(async (req, res, next) => {
  let restaurant = await restaurantService.selectByIdThrowIfNotFound(req.query._id);
  if (restaurant.user !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('Restaurant not found');
  }

  res.send(await restaurantService.updateById(restaurant._id, req.body));
});



lib.getRestaurantDetailsById = ahw(async (req, res, next) => {
  let restaurant = await restaurantService.selectByIdThrowIfNotFound(req.query._id);
  
  let { bestReview, worstReview, ownReview } = await reviewService.getBestWorstAndOwnReviews(restaurant._id, req.user._id);

  let recentReviews = await reviewService.getRecentReviews(restaurant._id, req.query.searchString);
  // let reviewsByUser = await reviewService.selectWithPaging({restaurant: restaurant._id, user: req.user._id}, {sort: '-date', populate: 'user'});

  let { avgRating = 0, reviewCount = 0, pendingReviewCount = 0 } = await reviewService.getAverageRatingByRestaurantId(restaurant._id);
  restaurant.avgRating = avgRating;
  restaurant.reviewCount = reviewCount;

  res.send({ restaurant, bestReview, worstReview, recentReviews, ownReview });
});



lib.deleteRestaurantById = ahw(async (req, res, next) => {
  let restaurant = await restaurantService.selectByIdThrowIfNotFound(req.query._id);
  if (restaurant.user !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('Restaurant not found');
  }
  await restaurantService.deleteById(restaurant._id);
  res.status(204).send();
});



lib.getAllWithFilterAndPaging = ahw(async (req, res, next) => {
  const { pageNumber: page = 1, pageSize: limit = 10, avgRating, sort, searchString } = req.query;
  let options = {
    page,
    limit,
    sort,
  };

  let beforeAggregationQuery = {};
  if (searchString) {
    beforeAggregationQuery.name = new RegExp(searchString, 'i');
  }
  if (req.user.role === 'owner') {
    beforeAggregationQuery.user = req.user._id;
  }

  let afterAggregationQuery = {};
  if (avgRating) {
    afterAggregationQuery.avgRating = { $gt: avgRating - 1, $lte: avgRating };
    options.afterAggregationQuery = afterAggregationQuery;
  }
  
  let result = await restaurantService.selectWithAvgRatingAndPaginate(beforeAggregationQuery, options);
  if (!(result && result.items && result.items.length)) {
    throw new NotFoundError('Restaurants not found');
  }
  res.send(result);
});


lib.getOwnRestaurants = ahw(async (req, res, next) => {
  let result = await restaurantService.selectOwnRestaurantsWithPendingReviewCounts(req.user._id);
  if (!(result && result.items && result.items.length)) {
    throw new NotFoundError('Restaurants not found');
  }
  
  res.send(result);
});
module.exports = lib;