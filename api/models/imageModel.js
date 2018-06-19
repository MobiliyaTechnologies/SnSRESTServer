var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var imageSchema = baseModel.discriminator('imageDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    imageName: {type: String},
    imgBase64: {type: String},
    camId: {type: String},
    deviceName: {type: String},
    createdAt: { type: String }
}));

module.exports = imageSchema;