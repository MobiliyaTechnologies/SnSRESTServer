var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var aggregator = mongoose.model('aggregatorDetails');
var computeEngine = mongoose.model('computeEngineDetails');
var baseModel = require('./baseModel').Base;

var cameraSchema = baseModel.discriminator('cameraDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    deviceType: { type: String },
    deviceName: { type: String , required: true},
    feature: {type: String, default: 'Other'},
    streamingUrl: { type: String },
    status: { type: String },
    coordinates: {type: Object},
    boundingBox: {type: Array},
    computeEngine: {type: Schema.ObjectId, ref: 'computeEngine'},
    aggregator: {type: Schema.ObjectId, ref: 'aggregator'},
    imageHeight: {type: Number},
    imageWidth: {type: Number},
    frameWidth: {type: Number},
    frameHeight: {type: Number},
    location: {type: String},
    isPlotted: {type: Number, default: 0},
    lastSeen: { type : Date, default: Date.now }
}));

module.exports = cameraSchema;