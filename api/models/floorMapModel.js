var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cameraPlot = new Schema({
    x: { type: String },
    y: { type: String },
    camId: { type: String },
    deviceName: { type: String },
    eyesight: {type: Object},
    rotationAngle: {type: Number},
    isDeleted: {type: Number, default: 0}
});

var baseModel = require('./baseModel').Base;

var floorMapSchema = baseModel.discriminator('floorMapDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    name: {type: String, required: true},
    location: {type: String},
    cameras:[cameraPlot],
    base64: {type: String},
    imagePath: {type: String},
    createdAt: { type: Date, default: Date.now }
}));

module.exports = floorMapSchema;