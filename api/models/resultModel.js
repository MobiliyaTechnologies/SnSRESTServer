var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var resultSchema = new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    camId: {type: String},
    deviceName: {type: String},
    imageName: {type: String},
    resultCount: { type: Number },
    result: { type : Array },
    bboxResults : {type: Array},
    feature: {type: String},
    totalCount: {type: Number},
    isTripline: {type: String},
    timestamp: { type: Number},
    createdAt: { type : Date, default: Date.now }
});

resultSchema.index({ camId: -1});
resultSchema.index({ timestamp: -1});
module.exports = mongoose.model('resultDetails', resultSchema);