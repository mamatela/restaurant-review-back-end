const User = require('../../src/db/models/user.model');
const bcrypt = require('bcrypt');

const password = 'string123';
const hashedPassword = bcrypt.hashSync(password, 8);

let lib = {};
lib.password = password;
lib.hashedPassword = hashedPassword;


lib.admin = {
  _id: 1,
  firstName: 'admin',
  lastName: 'admin',
  email: 'admin@example.com',
  password,
  role: 'admin',
};

lib.customer1 = {
  _id: 2,
  firstName: 'customer1',
  lastName: 'customer1',
  email: 'customer1@example.com',
  password,
  role: 'customer',
};

lib.customer2 = {
  _id: 3,
  firstName: 'customer2',
  lastName: 'customer2',
  email: 'customer2@example.com',
  password,
  role: 'customer',
};

lib.owner1 = {
  _id: 4,
  firstName: 'owner1',
  lastName: 'owner1',
  email: 'owner1@example.com',
  password,
  role: 'owner',
};

lib.owner2 = {
  _id: 5,
  firstName: 'owner2',
  lastName: 'owner2',
  email: 'owner2@example.com',
  password,
  role: 'owner',
};



// lib.customer = lib.customer1;
// lib.owner = lib.owner1;

lib.insertUser = async (user) => {
  if (typeof user === 'string') user = lib[user];
  await User.create(user);
};

lib.insertAllUsers = async (user) => {
  await Promise.all([
    lib.insertUser('admin'),
    lib.insertUser('owner1'),
    lib.insertUser('owner2'),
    lib.insertUser('customer1'),
    lib.insertUser('customer2'),
  ]);
};

module.exports = lib;