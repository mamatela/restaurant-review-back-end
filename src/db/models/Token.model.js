const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const schema = mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  user: {
    type: Number,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['refresh', 'reset_password'],
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
  blacklisted: {
    type: Boolean,
    default: false,
  },
},
  {
    timestamps: true,
    _id: false
  }
);

autoIncrement.initialize(mongoose.connection);
schema.plugin(autoIncrement.plugin, { model: 'Token', startAt: 1 })
const Token = mongoose.model('Token', schema);

module.exports = Token;