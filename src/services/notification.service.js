
const { NotFoundError, BadRequestError } = require('../utils/errors');
const Notification = require('../db/models/Notification.model');
const restaurantService = require('./restaurant.service');


let notifService = {};


/**
 * Creates a new notification
 * @param {Object} notificationBody body
 * @returns {Promise<Notification>} - Newly created notification
 */
notifService.createNew = async (notificationBody) => {
  // let notif = new Notification(notificationBody);
  // await notif.save();
  // return Notification.findById(notif._id).lean();
  return Notification.create(notificationBody);
}


/**
 * Creates a "new review" notification
 * @param {Object} review review json
 * @param {Object} restaurant restaurant json
 * @param {Object} customer customer user json
 * @returns {Promise<Notification>} - Newly created notification
 */
notifService.createNewReviewNotification = async (review, restaurant, customer) => {
  let notificationBody = {
    type: 'new_review',
    user: restaurant.user,
    navUrl: `/restaurants?_id=${restaurant._id}`,
    review: review._id,
    text: `${restaurant.name} got a new review from ${customer.firstName || 'a customer'}`,
  };
  return await notifService.createNew(notificationBody);
}

/**
 * Creates a "new reply" notification
 * @param {Object} review review json
 * @param {Object} restaurant restaurant json
 * @param {Object} owner owner user json
 * @returns {Promise<Notification>} - Newly created notification
 */
notifService.createNewReplyNotification = async (review, restaurant, owner) => {
  let notificationBody = {
    type: 'new_reply',
    user: review.user,
    navUrl: `/restaurants?_id=${restaurant._id}`,
    review: review._id,
    text: `Your review of ${restaurant.name} got a reply from the owner!`,
  };
  return await notifService.createNew(notificationBody);
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
 * @returns {Array<Object>} Array of results
 */
notifService.selectWithPaging = async (query, options = {}) => {
  return await Notification.paginate2(query, options);
}

// /**
//  * Returns paginated list of notifications for the user. Recent first.
//  * Also marks all the notifs as seen
//  * @param {number} userId id of the user
//  * @param {Object} [options] paging
//  * @param {number} [options.page] page number
//  * @param {number} [options.limit] page size
//  * @returns {Array<Object>} Array of notifications
//  */
// notifService.selectNotifsByUserIdAndPaginate = async (userId, options = {}) => {
//   options.sort = '-createdAt';
//   let result = await Notification.paginate2({ user: userId }, options);
//   return result;
// }

/**
 * Marks all notifications as "seen".
 * @param {number} userId id of the user
 */
notifService.markAllAsSeen = async (userId) => {
  let query = {
    user: userId,
    seenDate: { $exists: false }
  };
  await Notification.updateMany(query, { $set: { seenDate: Date.now() } });
}

module.exports = notifService;