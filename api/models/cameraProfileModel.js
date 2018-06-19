var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var cameraProfileSchema = baseModel.discriminator('cameraProfileDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    cameraId: {type: String, required: true},
    imageBase64: {type: String},
    createdAt: { type : Date, default: Date.now }
}));

module.exports = cameraProfileSchema;