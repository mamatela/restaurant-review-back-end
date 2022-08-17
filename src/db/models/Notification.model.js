const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const customPaginatePlugin = require('../plugins/paginate.plugin');


const notificationSchema = mongoose.Schema({
  user: {
    type: Number,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['new_review', 'new_reply'],
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  // restaurant: {
  //   type: Number,
  //   required: false,
  //   ref: 'Restaurant'
  // },
  review: {
    type: Number,
    required: false,
    ref: 'Review'
  },
  navUrl: {
    type: String,
    required: false,
    trim: true,
  },
  // date: {
  //   type: Date,
  //   required: true,
  //   default: Date.now
  // },
  seenDate: {
    type: Date,
  },
  readDate: {
    type: Date,
  },
},
  {
    timestamps: true,
  }
);

autoIncrement.initialize(mongoose.connection);
notificationSchema.plugin(autoIncrement.plugin, { model: 'Notification', startAt: 1 });
notificationSchema.plugin(customPaginatePlugin);



const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;