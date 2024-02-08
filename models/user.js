const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username:{
    type: String,
    required: [true, 'Please enter username'],
    trim: true,
    lowercase: true,
    unique: true
  },
  firstname: {
    type: String,
    trim: true,
    lowercase: true
  },
  lastname: {
    type: String,
    trim: true,
    lowercase: true
  },
  password:{
    type: String,
    required: [true, 'Please enter password'],
    minlength:5
  },
  createon: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.post('init', (doc) => {
  console.log('%s has been initialized from the db', doc._id);
});

UserSchema.post('validate', (doc) => {
  console.log('%s has been validated (but not saved yet)', doc._id);
});

UserSchema.post('save', (doc) => {
  console.log('%s has been saved', doc._id);
});

UserSchema.post('remove', (doc) => {
  console.log('%s has been removed', doc._id);
});

const User = mongoose.model("User", UserSchema);
module.exports = User;