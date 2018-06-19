var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var videoSchema = baseModel.discriminator('videoDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    filename: {type: String},
    indexId: {type: String},
    videoName: {type: String},
    camId: {type: String},
    deviceName: {type: String},
    streamingUrl: {type: String},
    datetime: {type: String},
    duration: { type: String },
    status: {type: Number},
    createdAt: { type : Date, default: Date.now }
}));

module.exports = videoSchema;