const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
  email:{
    type:String,
    unique:true,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  username:{
    type:String,
    unique:true,
    required:true
  }
})

const Todo = new Schema({
  title:{
    type:String,
    required:true
  },
  done:{
    type:Boolean,
  },
  userId:{
    type:mongoose.Types.ObjectId,
    ref:"User"
  }
})

const UserModel = mongoose.model('users',User)
const TodoModel = mongoose.model('todos',Todo)

module.exports = {
  UserModel,
  TodoModel
}