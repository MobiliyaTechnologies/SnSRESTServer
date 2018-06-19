var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var aggregatorSchema = baseModel.discriminator('aggregatorDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    name: { type: String, required: true},
    url: { type: String, required: true },
    macId: { type: String, required: true},
    ipAddress: { type: String, required: true },
    channelId: { type: String, required: true },
    availability: {type: String},
    location: { type: String },
    lastSeen: { type : Number},
    status: {type: Number}
}));

module.exports = aggregatorSchema;