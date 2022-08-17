const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const customPaginatePlugin = require('../plugins/paginate.plugin');


const restaurantSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    text: true,
  },
  user: {
    type: Number,
    required: true,
    ref: 'User'
  },
  address: {
    type: String,
    required: false,
    trim: true,
    text: true,
  },
  picUrl: {
    type: String,
    required: false,
    trim: true,
  },
  distance: {
    type: Number,
    required: false,
  },
},
  {
    timestamps: true,
  }
);

autoIncrement.initialize(mongoose.connection);
restaurantSchema.plugin(autoIncrement.plugin, { model: 'Restaurant', startAt: 1 });
restaurantSchema.plugin(customPaginatePlugin);

// restaurantSchema.index({ name: 'text', address: 'text' }, {weights: {name: 2, address: 1}});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Restaurant.syncIndexes();

module.exports = Restaurant;