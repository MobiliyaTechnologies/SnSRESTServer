var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var baseModel = require('./baseModel').Base;

var powerBiSchema = baseModel.discriminator('powerBiDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true },
    confName: { type: String },
    grant_type: { type: String },
    username: { type: String },
    password: { type: String },
    client_id: { type: String },
    client_secret: { type: String },
    resource: { type: String },
    oauthUrl: { type: String },
    contentTypeHeader: { type: String },
    embed_url: { type: String },
    dId: { type: String }
}));

module.exports = powerBiSchema;