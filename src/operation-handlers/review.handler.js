const ahw = require('../utils/async-handler-wrapper');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { reviewService, notificationService } = require('../services');
const restaurantService = require('../services/restaurant.service');

const lib = {};

lib.createReview = ahw(async (req, res, next) => {
  req.body.user = req.user._id;
  let restaurant = await restaurantService.selectByIdThrowIfNotFound(req.body.restaurant);
  let review = await reviewService.createNew(req.body);
  await notificationService.createNewReviewNotification(review, restaurant, req.user);
  res.status(201).send(review);
});

lib.editReviewById = ahw(async (req, res, next) => {
  let review = await reviewService.selectByIdThrowIfNotFound(req.query._id);
  if (review.user !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('Review not found');
  }

  if (req.body.restaurant) {
    throw new BadRequestError('Cannot update restaurantId of review');
  }

  if (review.reply && req.user.role !== 'admin') {
    throw new ForbiddenError('Cannot edit this review. Owner has already replied.');
  }

  // let restaurant = await restaurantService.selectByIdThrowIfNotFound(review.restaurant);
  // await notificationService.createNewReviewNotification(review, restaurant, req.user);
  let updatedReview = await reviewService.updateById(review._id, req.body);
  res.send(updatedReview);
});

lib.getReviewById = ahw(async (req, res, next) => {
  let review = await reviewService.selectByIdThrowIfNotFound(req.query._id);
  if (review.user !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('Review not found');
  }

  res.send(review);
});

lib.deleteReviewById = ahw(async (req, res, next) => {
  let review = await reviewService.selectByIdThrowIfNotFound(req.query._id);
  if (review.user !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('Review not found');
  }

  if (review.reply && req.user.role !== 'admin') {
    throw new ForbiddenError('Cannot delete this review. Owner has already replied.');
  }

  await reviewService.deleteById(review._id);
  res.status(204).send();
});


lib.getReviewsByRestaurantId = ahw(async (req, res, next) => {
  const { pageNumber: page = 1, pageSize: limit = 10, searchString, restaurantId } = req.query;
  let query = { restaurant: restaurantId };
  if (searchString) {
    query.$or = [
      { comment: new RegExp(searchString, 'i') },
      { reply: new RegExp(searchString, 'i') },
    ]
  }
  let result = await reviewService.selectWithPaging(query, { sort: '-date', populate: 'user', page, limit });
  if (!(result && result.items && result.items.length)) {
    throw new NotFoundError('Reviews not found');
  }

  res.send(result);
});


lib.addReplyByReviewId = ahw(async (req, res, next) => {
  let review = await reviewService.selectByIdPopulateRestaurantThrow404(req.query.reviewId);
  if (review.restaurant.user !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('Review not found');
  }

  review = await reviewService.updateById(review._id, { reply: req.body.reply, replyDate: Date.now() }, { new: true });
  await notificationService.createNewReplyNotification(review, review.restaurant, req.user);

  res.status(201).send(review);
});

lib.editReplyByReviewId = ahw(async (req, res, next) => {
  let review = await reviewService.selectByIdPopulateRestaurantThrow404(req.query.reviewId);
  if (review.restaurant.user !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('Review not found');
  }
  res.send(await reviewService.updateById(review._id, { reply: req.body.reply, replyDate: Date.now() }));
});

lib.deleteReplyByReviewId = ahw(async (req, res, next) => {
  let review = await reviewService.selectByIdPopulateRestaurantThrow404(req.query.reviewId);
  if (review.restaurant.user !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('Review not found');
  }
  await reviewService.updateById(review._id, { $unset: { reply: 1, replyDate: 1 } });
  res.status(204).send();
});
module.exports = lib;