var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var faceSchema = baseModel.discriminator('facedetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    persistedFaceId: {type: String},
    userData: {type: String},
    age: {type: Number},
    gender: {type: String},
    deviceName: {type: String},
    userImage: {type: String},
    faceRectangle: {type: Object},
    status: {type: Number, default: 0},
    timestamp: { type: Number },
    imgUrl: {type: String},
    flag: {type: Boolean},
    createdAt: { type : Date, default: Date.now },
    createdDate: {type: String}
}));

module.exports = faceSchema;