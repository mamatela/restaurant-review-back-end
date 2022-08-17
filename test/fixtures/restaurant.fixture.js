const Restaurant = require('../../src/db/models/Restaurant.model');
const { owner1, owner2 } = require('./user.fixture');

let lib = {};


lib.owner1Restaurant1 = {
  _id: 1,
  user: owner1._id,
  name: 'restaurant1',
  address: 'address1',
};

lib.owner1Restaurant2 = {
  _id: 2,
  user: owner1._id,
  name: 'restaurant2',
  address: 'address2',
};

lib.owner2Restaurant1 = {
  _id: 3,
  user: owner2._id,
  name: 'restaurant3',
  address: 'address3',
};

lib.insertRestaurant = async (restaurant) => {
  if (typeof restaurant === 'string') restaurant = lib[restaurant];
  await Restaurant.create(restaurant);
};

lib.insertAllRestaurants = async () => {
  await Promise.all([
    lib.insertRestaurant(lib.owner1Restaurant1),
    lib.insertRestaurant(lib.owner1Restaurant2),
    lib.insertRestaurant(lib.owner2Restaurant1),
  ]);
};


module.exports = lib;