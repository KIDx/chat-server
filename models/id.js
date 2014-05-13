
var mongoose = require('mongoose')
,   Schema = mongoose.Schema;

function ID() {
}

module.exports = ID;

var idObj = new Schema({
  key: {type: String, index: {unique: true}},
  value: Number
});

mongoose.model('ids', idObj);
var ids = mongoose.model('ids');

ID.get = function(key, callback) {
  ids.findOneAndUpdate({key: key}, {$inc: {value: 1}}, function(err, doc){
    if (err) {
      console('ID.get Error: \n'+err);
    }
    if (!doc) {
      throw('ids should be init first!');
    }
    return callback(err, doc.value.toString());
  });
};