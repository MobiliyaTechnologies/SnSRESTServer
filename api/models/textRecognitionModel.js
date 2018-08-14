var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var textRecognitionSchema = new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    camId: {type: String},
    deviceName: {type: String},
    createdAt: { type : Date, default: Date.now },
    matchedWord: {type: String},
    relativeY: {type: String},
    relativeX: {type: String}
});

module.exports = mongoose.model('textRecognitionDetails', textRecognitionSchema);