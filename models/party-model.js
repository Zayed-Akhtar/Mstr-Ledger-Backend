const mongoose = require('mongoose');

const partySchema = mongoose.Schema({
  partyCode: {
    type: String,
    required: true
  },
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
  },
  fullAddress: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  name: {
    type: String,
    required: true
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  email: {
    type: String,
  },
  active: {
    type: Boolean,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);