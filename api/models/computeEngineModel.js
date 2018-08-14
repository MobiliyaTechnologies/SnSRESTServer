var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var detectionAlgoSchema = new Schema({
    featureName:{type: String},
    fps: {type: Number},
    shapeSupported: [String],
    objectSupported: [String],
    status : {type: Number , default: 0}
})

var baseModel = require('./baseModel').Base;

var computeEngineSchema = baseModel.discriminator('computeEngineDetails', new Schema({
    _id: { type: Schema.ObjectId, auto: true},
    name: { type: String, required: true},
    deviceType: { type: String, required: true },
    macId: { type: String, required: true },
    ipAddress: { type: String, required: true },
    lastSeen: { type : Number },
    status: { type: Number },
    location: { type: String },
    detectionAlgorithms: [detectionAlgoSchema],
    cameraSupported: { type: Number, required: true },
    availability: {type: Number},
    jetsonCamFolderLocation: {type: String},
    wayToCommunicate: {type: String},
    tier: {type: Number, default: 0},
    isCloudCompute: {type: Boolean, default: false}
}));

module.exports = computeEngineSchema;