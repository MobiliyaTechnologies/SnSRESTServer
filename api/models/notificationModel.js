var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var notificationSchema = baseModel.discriminator('notificationDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    message: {type: String},
    isRead: {type: Number, default: 0},
    timestamp: {type: Number},
    createdAt: { type : Date, default: Date.now }
}));

module.exports = notificationSchema;