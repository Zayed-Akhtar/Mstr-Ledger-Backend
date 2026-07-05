const mongoose = require('mongoose');

const partySchema = mongoose.Schema({
partyCode: {
    type: String,
    required: true},
  area: {
    type: String,
    required: true
  },
  fullAddress: {
    type: String,
  },
  phoneNumber:{
    type:String,
    required:true
  },
  name:{
    type:String,
    required:true   
  },
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required:true
  },
  transactions:[
    {type:mongoose.Schema.Types.ObjectId,
    ref:'Transaction'}
    ],
}, {timestamps:true});

module.exports = mongoose.model('Party', partySchema);