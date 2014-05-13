
var mongoose = require('mongoose')
,   Schema = mongoose.Schema;

function Message(message) {
  this.type = message.type;
  this.from = message.from;
  this.to = message.to;
  this.msg = message.msg;
  this.read = message.read;
  this.inDate = message.inDate;
}

module.exports = Message;

var messageObj = new Schema({
  type: Number,
  from: String,
  to: String,
  msg: String,
  read: Number,
  inDate: Number
});

mongoose.model('messages', messageObj);
var messages = mongoose.model('messages');

Message.prototype.save = function(callback) {
  message = new messages();
  message.type = this.type;
  message.from = this.from;
  message.to = this.to;
  message.msg = this.msg;
  message.read = this.read;
  message.inDate = this.inDate;
  message.save(function(err){
    if (err) {
      console.log('Message.save failed!');
    }
    return callback(err);
  });
};

Message.find = function(Q, callback) {
  messages.find(Q).exec(function(err, docs){
    if (err) {
      console.log('Message.find failed!');
    }
    return callback(err, docs);
  });
};

Message.multiUpdate = function(Q, H, callback) {
  messages.update(Q, H, {multi: true}, function(err){
    if (err) {
      console.log('Message.multiUpdate failed!');
    }
    return callback(err);
  });
};

Message.update = function(Q, H, callback) {
  messages.findOneAndUpdate(Q, H, function(err, msg){
    if (err) {
      console.log('Message.update failed!');
    }
    return callback(err, msg);
  });
};