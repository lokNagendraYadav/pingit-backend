const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  email: String,
  name: String,
  url: String,
  interval: Number
});

module.exports = mongoose.model('Url', urlSchema);
