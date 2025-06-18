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
    default: null // New field for 6-hour cooldown
  }
});

module.exports = mongoose.model('Url', urlSchema);
