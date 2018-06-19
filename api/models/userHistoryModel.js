var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userHistorySchema = new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    camId: {type: String},
    deviceName: {type: String},
    persistedFaceId: {type: String},
    timestamp: { type: Number},
    createdAt: { type : Date, default: Date.now },
    relativeY: {type: String},
    relativeX: {type: String},
    userData: {type: String},
    age: {type: Number},
    gender: {type: String}
});

userHistorySchema.index({ persistedfaceId: -1});
userHistorySchema.index({ timestamp: -1});
module.exports = mongoose.model('userHistoryDetails', userHistorySchema);