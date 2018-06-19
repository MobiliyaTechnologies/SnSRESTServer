var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var retentionPricingSchema = baseModel.discriminator('retentionPricingDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true },
    price: {type: Number}
}));

module.exports = retentionPricingSchema;