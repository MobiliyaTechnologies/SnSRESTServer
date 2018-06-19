var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var videoSchema = baseModel.discriminator('videoRetentionDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    camId: {type: String},
    videoName: {type: String},
    retentionPeriod: { type: Number },
    videoUrl: {type: String},
    deviceName: {type: String},
    date: {type: String},
    timeInterval: {type: String},
    videoUrl: {type: String},
    retentionTimestamp: {type: Number},
    createdAt: { type : Date, default: Date.now }
}));

module.exports = videoSchema;