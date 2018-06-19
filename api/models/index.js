/** 
 * MongoDB connection code 
 */
var mongoose = require('mongoose');
var config = require('../../settings');
var logger = require('../logger/index').logger;
var logStr = 'MongoDBConnection';

/**
 * Create collections in mongoDB database
 */
var baseModel = require('./baseModel');
var resultModel = require('./resultModel');
var roleModel = require('./roleModel');
var computeEngineModel = require('./computeEngineModel');
var aggregatorModel = require('./aggregatorModel');
var imageModel = require('./imageModel');
var cameraProfileModel = require('./cameraProfileModel');
var floorMapModel = require('./floorMapModel');
var cameraModel = require('./cameraModel');
var faceModel = require('./faceRecognitionModel');
var notificationModel = require('./notificationModel');
var videoIndexingModel = require('./videoIndexingModel');
var powerbiModel = require('./powerbiModel');
var videoRetentionModel = require('./videoRetentionModel');
var userHistoryModel = require('./userHistoryModel');
var retentionPricingModel = require('./retentionPricingModel');

/**
 * Build the connection string 
 */
var dbURI = config.mongoose.url;
var options = config.mongoose.options;

/**
 * Create the database connection 
 */
mongoose.connect(dbURI, options);

mongoose.set('debug', false);

/**
 * Connection events
 */
mongoose.connection.on('connected', function () {
    logger.debug("%s : Mongoose connection open", logStr);
});

mongoose.connection.on('error', function (error) {
    logger.error("%s : Mongoose connection error ", logStr, error);
});

mongoose.connection.on('disconnected', function () {
    logger.error("%s : Mongoose disconnected ", logStr);
});