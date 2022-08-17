const Restaurant = require('../db/models/Restaurant.model');
const Review = require('../db/models/Review.model');
const Token = require('../db/models/Token.model');
const User = require('../db/models/User.model');
const { BadRequestError } = require('../utils/errors');


let userService = {};

/**
 * User
 * @typedef {Object} User
 * @property {string} email - unique
 * @property {string} password - plain
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} role
 */


/**
 * Get user by id
 * @param {number} id - id of the user
 * @returns {Promise<User>}
 */
userService.selectById = async (id) => {
  // assert(id !== undefined && typeof id === 'number' && Number.isInteger(id), 'Id must be an integer');
  return await User.findById(id).select(['-password']).lean();
}


/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
userService.selectByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase() }).select(['-password']).lean();
}


/**
 * Creates new user
 * @param {User} userBody
 * @returns {Promise<User>} - Newly created user without the password.
 */
userService.createNew = async (userBody) => {
  if (!(await userService.isEmailAvailable(userBody.email))) {
    throw new BadRequestError('Email already taken');
  }
  let user = new User(userBody);
  await user.save();
  return User.findById(user._id).select(['-password']).lean();
}


/**
 * Update user
 * @param {number} id - id of the user
 * @param {User} updateBody
 * @returns {Promise<User>} - updated user (without password)
 */
userService.updateById = async (id, updateBody) => {
  if (!(await userService.isEmailAvailable(updateBody.email, id))) {
    throw new BadRequestError('Email already taken');
  }
  return await User.findOneAndUpdate({ _id: id }, updateBody, { new: true })
    .select(['-password'])
    .lean(); // {new: true} to return updated user.
}

/**
 * Returns user by email and password only if both are correct. Otherwise returns false.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User | boolean>}
 */
userService.selectByEmailAndPassword = async (email, password) => {
  let user = await await User.findOne({ email }, ['password']);
  if (!user) return false;

  if (!(await user.checkPassword(password))) return false;

  return await userService.selectById(user._id); // to make it lean
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
 */
userService.selectWithPaging = async (query, options = {}) => {
  if (!options.select) options.select = ['-password'];
  else options.select.push('-password')
  return await User.paginate2(query, options);
}

/**
 * Checks whether passowrd is strong enough
 * @param {string} password password to check
 * @returns {boolean}
 */
userService.checkPasswordRequirements = (password) => {
  if (!password) return false;
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
}

/**
 * Delete user
 * @param {number} id - id of the user
 */
userService.cascadeDeleteById = async (id) => {
  await Restaurant.deleteMany({user: id});
  await Review.deleteMany({user: id});
  await Token.deleteMany({user: id});
  await User.deleteOne({ _id: id });
}

/**
 * Check email availability
 * @param {strin} email
 * @returns {Promise<boolean>}
 */
userService.isEmailAvailable = async (email, excludeId) => {
  let user = await User.findOne({ email, _id: { $ne: excludeId } }).lean();
  return !user;
}

module.exports = userService;