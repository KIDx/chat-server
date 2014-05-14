
var mongoose = require('mongoose')
,   Schema = mongoose.Schema
,   pageNum = 20
,   sl = { password: 0, _id: 0, __v: 0 };

function User(user) {
  this.name = user.name;
  this.nick = user.nick;
  this.password = user.password;
  this.sex = user.sex;
  this.birthday = user.birthday;
  this.regTime = user.regTime;
}

module.exports = User;

var userObj = new Schema({
  name: {type: String, index: {unique: true}},
  nick: String,
  password: String,
  signature: String,
  sex: Number,
  birthday: Number,
  city: String,
  regTime: Number,
  visTime: Number,
  imgFormat: String,
  img: String,
  friends: Array
});

mongoose.model('users', userObj);
var users = mongoose.model('users');

User.prototype.save = function(callback) {
  user = new users();
  user.name = this.name;
  user.nick = this.nick;
  user.password = this.password;
  user.sex = this.sex;
  user.birthday = this.birthday;
  user.regTime = this.regTime;
  user.save(function(err){
    if (err) {
      console.log('User.save failed!');
    }
    return callback(err);
  });
};

User.findOne = function(Q, callback) {
  users.findOne(Q).select(sl).exec(function(err, doc){
    if (err) {
      console.log('User.watch failed!');
    }
    return callback(err, doc);
  });
};

User.distinct = function(key, Q, callback) {
  users.distinct(key, Q, function(err, docs){
    if (err) {
      console.log('User.distinct failed!');
    }
    return callback(err, docs);
  });
};

User.find = function(Q, callback){
  users.find(Q).select(sl).exec(function(err, docs){
    if (err) {
      console.log('User.find failed!');
    }
    return callback(err, docs);
  });
};

User.get = function(Q, page, callback) {
  users.find(Q).select(sl).sort({regTime: -1}).skip((page-1)*pageNum).limit(pageNum).exec(function(err, docs){
    if (err) {
      console.log('User.get failed!');
    }
    return callback(err, docs);
  });
};

User.count = function(Q, callback) {
  users.count(Q, function(err, count){
    if (err) {
      console.log('User.count failed!');
    }
    return callback(err, count);
  });
};

User.update = function(Q, H, callback) {
  users.update(Q, H, function(err){
    if (err) {
      console.log('User.update failed!');
    }
    return callback(err);
  });
};

User.findOneAndUpdate = function(Q, H, callback) {
  users.findOneAndUpdate(Q, H, {select: sl, new: false}, function(err, user){
    if (err) {
      console.log('User.findOneAndUpdate failed!');
    }
    return callback(err, user);
  });
};