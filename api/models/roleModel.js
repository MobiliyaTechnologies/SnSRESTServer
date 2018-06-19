var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var roleSchema = baseModel.discriminator('roleDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    emailId: { type: String},
    firstName: {type: String},
    lastName: {type: String},
    role: { type: String }
}));

module.exports = roleSchema;