const ahw = require('../utils/async-handler-wrapper');
const userService = require('../services/user.service');
const restaurantService = require('../services/restaurant.service');
const reviewService = require('../services/review.service');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const lib = {};

lib.createUser = ahw(async (req, res, next) => {
  if (!userService.checkPasswordRequirements(req.body.password)) {
    throw new BadRequestError('Password must contain at least one letter and one number');
  }
  let user = await userService.createNew(req.body);
  res.status(201).send(user);
});


lib.updateUser = ahw(async (req, res, next) => {
  let user = await userService.selectById(req.query._id);
  if (!user) throw new NotFoundError('User not found');

  if (req.query._id !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('User not found');
  }

  if (req.body.role || req.body.password) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('role and password cannot be edited');
    }

    if (req.body.role) {
      if (user.role == 'owner' && req.body.role == 'customer') {
        let ownRestaurants = await restaurantService.selectWithPaging({ user: user._id });
        if (ownRestaurants && ownRestaurants.items && ownRestaurants.items.length) {
          throw new BadRequestError('This user has already created restaurants and cannot be changed to a regular user.');
        }
      }
      if (user.role == 'customer' && req.body.role == 'owner') {
        let ownReviews = await reviewService.selectWithPaging({ user: user._id });
        if (ownReviews && ownReviews.items && ownReviews.items.length) {
          throw new BadRequestError('This user has already reviewed some restaurants. Changed them to a restaurant owner is no longer possible.');
        }
      }
    }
  }

  

  res.send(await userService.updateById(user._id, req.body));
});


lib.getUserById = ahw(async (req, res, next) => {
  if (req.query._id !== req.user._id && req.user.role !== 'admin') {
    throw new NotFoundError('User not found');
  }

  let user = await userService.selectById(req.query._id);
  if (!user) throw new NotFoundError('User not found');

  res.send(user);
});


lib.getUsersWithPaging = ahw(async (req, res, next) => {
  const { pageNumber: page = 1, pageSize: limit = 10, searchString, role } = req.query;
  let query = {};
  if (role) query.role = role;
  if (searchString) {
    query.$or = [
      { firstName: new RegExp(searchString, 'i') },
      { lastName: new RegExp(searchString, 'i') },
      { email: new RegExp(searchString, 'i') },
    ]
  }
  let userResults = await userService.selectWithPaging(query, { page, limit, sort: '-createdAt' });
  if (!(userResults && userResults.items && userResults.items.length)) {
    throw new NotFoundError('Users not found');
  }

  res.send(userResults);
});


lib.deleteUser = ahw(async (req, res, next) => {
  let user = await userService.selectById(req.query._id);
  if (!user) throw new NotFoundError('User not found');
  await userService.cascadeDeleteById(user._id);
  res.status(204).send();
});




// lib.updateOwnUserPassword = [
//   authCreator('admin', 'customer', 'owner'),
//   ahw(async (req, res, next) => {
//     let user = await userService.selectById(req.query._id);
//     if (!user) throw new NotFoundError('User not found');

//     if (!userService.checkPasswordRequirements(req.body.newPassword)) {
//       throw new BadRequestError('Password must contain at least one letter and one number');
//     }

//     res.send(await userService.updateById(req.query._id, { password: req.body.newPassword }));
//   })
// ];

// lib.getOwnUserInfo = [
//   authCreator('admin', 'customer', 'owner'),
//   ahw(async (req, res, next) => {
//     res.send(req.user);
//   })
// ];

module.exports = lib;