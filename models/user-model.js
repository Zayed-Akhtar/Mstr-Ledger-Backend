const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
firstName: {
    type: String,
    required: true},
  lastname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  password:{
    type:String,
    required:true
  },
  phoneNumber:{
    type:String,
    required:true   
  },
  parties:[
    {type:mongoose.Schema.Types.ObjectId,
    ref:'Party'}
    ],
},
 {timestamps:true});

module.exports = mongoose.model('User', userSchema);