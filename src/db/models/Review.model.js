const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const customPaginatePlugin = require('../plugins/paginate.plugin');


const reviewSchema = mongoose.Schema({
  user: {
    type: Number,
    required: true,
    ref: 'User'
  },
  restaurant: {
    type: Number,
    required: true,
    ref: 'Restaurant'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  rating: {
    type: Number,
    required: true,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'rating cannot exceed 5'],
  },
  comment: {
    type: String,
    required: [true, 'Why not say something?'],
    trim: true,
  },
  reply: {
    type: String,
    required: false,
    trim: true,
  },
  replyDate: {
    type: Date,
    required: false,
  },
},
  {
    timestamps: true,
  }
);

autoIncrement.initialize(mongoose.connection);
reviewSchema.plugin(autoIncrement.plugin, { model: 'Review', startAt: 1 });
reviewSchema.plugin(customPaginatePlugin);



const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;