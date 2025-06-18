const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  email: String,
  name: String,
  url: String,
  interval: Number, // in minutes

  lastChecked: {
    type: Date,
    default: null
  },

  lastAlertSent: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Url', urlSchema);
