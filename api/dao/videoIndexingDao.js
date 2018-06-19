var videoIndexing = require('../models/videoIndexingModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'VideoIndexingDao';

/**
 * This function will save video indexing details to database
 * @param {object} req
 * @param {object} callback 
 */
var saveVideoIndex = function (req, callback) {
    logger.debug("%s : In saveVideoIndex function. Received request: " + JSON.stringify(req.body), logStr);
    videoIndexing.create(req.body, function (error, result) {
        if (error) {
            logger.error("%s : Error in saveVideoIndex function : ", logStr, error);
            callback(error, null);
        }
        else{
            logger.debug("%s: Video index data saved", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function will update the video indexing details
 * @param {object} req
 * @param {object} res 
 */
var updateVideoIndex = function (req, callback) {
    logger.debug("%s : In updateVideoIndex function. Received id: " + req.params.id, logStr);
    videoIndexing.findOneAndUpdate({ filename: req.params.id }, req.body, { new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateVideoIndex function : ", logStr, error);
            callback(error, null);
            return;
        }
        else{
            logger.debug("%s : Sending Success response of updateVideoIndex function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function will return all video index details or by status
 * @param {object} req 
 * @param {object} res 
 */
var getVideoIndex = function(req, res){
    logger.debug("%s : In getVideoIndex function", logStr);
    var queryCondition = {};
    if(req.query.status){
        queryCondition.status = req.query.status;
    }
    videoIndexing.find(queryCondition, function (error, result) {
        if (error) {
            logger.error("%s : Error in getVideoIndex function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of getVideoIndex function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    }).sort({ 'createdAt': -1 });
}

/**
 * This function will return video index details by name
 * @param {object} req 
 * @param {function} callback 
 */
var getVideoIndexByName = function(req, callback){
    logger.debug("%s : In getVideoIndexByName function", logStr);
    videoIndexing.findOne({'videoName': req.query.videoName}, function (error, result) {
        if (error) {
            logger.error("%s : Error in getVideoIndexByName function : ", logStr, error);
            callback(error, null);
        }
        else{
            logger.debug("%s : Sending Success response of getVideoIndexByName function.", logStr);
            callback(null, result);
        }
    });
}

/**
 * This function will remove the video 
 * @param {object} req 
 * @param {function} callback 
 */
var removeVideoById = function (req, res) {
    logger.debug("%s : In removeVideoById function", logStr);
    var videoId = req.query.videoId;
    videoIndexing.remove({ _id: videoId }, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeVideoById function : ", logStr, error);
            errorHandler(error, res);
        }
        else {
            logger.debug("%s : Sending Success response of removeVideoById function.", logStr);
            res.status(constants.httpStatusCodes.noContent).send();
        }
    });
};

exports.saveVideoIndex = saveVideoIndex;
exports.updateVideoIndex = updateVideoIndex;
exports.getVideoIndex = getVideoIndex;
exports.getVideoIndexByName = getVideoIndexByName;
exports.removeVideoById = removeVideoById;