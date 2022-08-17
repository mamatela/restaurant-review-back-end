const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const customPaginatePlugin = require('../plugins/paginate.plugin');
const bcrypt = require('bcrypt');


const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 8,
    select: false,
    validate(password) {
      if (!password
        || typeof password !== 'string'
        || password.length < 8
        || !/[a-zA-Z]/.test(password)
        || !/\d/.test(password)
      ) {
        throw new Error('Password must contain at least one letter and one number');
      }
    },
  },
  firstName: {
    type: String,
    required: false,
    trim: true,
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
    enum: ['admin', 'customer', 'owner']
  }
},
  {
    timestamps: true,
  }
);

autoIncrement.initialize(mongoose.connection);
userSchema.plugin(autoIncrement.plugin, { model: 'User', startAt: 1 });
userSchema.plugin(customPaginatePlugin);

/**
 * Check if password is correct
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.checkPassword = async function (password) {
  let passwordIsCorrect = false;
  try {
    passwordIsCorrect = await bcrypt.compare(password, this.password);
  }
  catch (err) {
    return false;
  }
  return passwordIsCorrect;
};

userSchema.pre(['save'], async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

userSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
  if (this._update && this._update.password) {
    this._update.password = await bcrypt.hash(this._update.password, 8);
  }
  next();
});


const User = mongoose.model('User', userSchema);

module.exports = User;