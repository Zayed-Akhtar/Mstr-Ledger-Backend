const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
credit: {
    type: Number,
    default: 0
  },
  debit: {
    type: Number,
    default: 0
  },
  transactionDate: {
    type: Date,
    required:true
  },
  balance: {
    type: Number,
    default: 0
  },
  description:{
    type:String,
    required:true
  },
  party :{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Party',
    required:true
  }
}, {timestamps:true});

module.exports = mongoose.model('Transaction', transactionSchema);