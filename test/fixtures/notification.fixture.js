const Notification = require('../../src/db/models/Notification.model');
const { owner1, owner2, customer1, customer2 } = require('./user.fixture');
const { review1OfRestaurant1, review2OfRestaurant1 } = require('./review.fixture');

let lib = {};


lib.newReviewNotif1 = {
  _id: 1,
  user: owner1._id,
  text: 'notif 1',
  type: 'new_review',
  review: review1OfRestaurant1._id,
  navUrl: 'navUrl',
};

lib.newReviewNotif2 = {
  _id: 2,
  user: owner1._id,
  text: 'notif 2',
  type: 'new_review',
  review: review2OfRestaurant1._id,
  navUrl: 'navUrl',
};


lib.newReviewNotif3 = {
  _id: 3,
  user: owner2._id,
  text: 'notif 5',
  type: 'new_review',
  review: review2OfRestaurant1._id,
  navUrl: 'navUrl',
};

lib.newReplyNotif1 = {
  _id: 4,
  user: customer1._id,
  text: 'notif 3',
  type: 'new_reply',
  review: review1OfRestaurant1._id,
  navUrl: 'navUrl',
};

lib.newReplyNotif2 = {
  _id: 5,
  user: customer1._id,
  text: 'notif 4',
  type: 'new_reply',
  review: review2OfRestaurant1._id,
  navUrl: 'navUrl',
};


lib.newReplyNotif3 = {
  _id: 6,
  user: customer2._id,
  text: 'notif 6',
  type: 'new_reply',
  review: review2OfRestaurant1._id,
  navUrl: 'navUrl',
};

lib.insertNotif = async (notif) => {
  if (typeof notif === 'string') notif = lib[notif];
  await Notification.create(notif);
};

lib.insertAllNotifs = async () => {
  await Promise.all([
    lib.insertNotif(lib.newReviewNotif1),
    lib.insertNotif(lib.newReviewNotif2),
    lib.insertNotif(lib.newReviewNotif3),
    lib.insertNotif(lib.newReplyNotif1),
    lib.insertNotif(lib.newReplyNotif2),
    lib.insertNotif(lib.newReplyNotif3),
  ]);
};


module.exports = lib;