var mongoose = require('mongoose');
var videoRetention = require('../models/videoRetentionModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'VideoRetentionDao';

/**
 * This function will save video retention details in database
 * @param {object} req Request contains video details
 * @param {object} res Response will return success response
 */
var saveVideoRetention = function (req, res) {
    logger.debug("%s : In saveVideoRetention function", logStr);
    videoRetention.create(req.body, function (error, result) {
        if (error) {
            logger.error("%s : Error in saveVideoRetention function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of saveVideoRetention function.", logStr);
        res.status(constants.httpStatusCodes.resourceCreated).send({ 'message': 'success' });
        return;
    });
};

/**
 * This function will return all uploaded video details
 * @param {object} req Request
 * @param {object} res Response will return uploaded video details
 */
var getVideoRetentionDetails = function (req, res) {
    logger.debug("%s : In getVideoRetentionDetails function", logStr);
    videoRetention.aggregate([
        { '$match': { camId: req.query.camId}},
        {
            $group: {
                "_id": "$date", deviceName: { $first: "$deviceName" }, camId: { $first: "$camId" }, 
                date: {$first: "$date"}, videoName: {$first: "$videoName"},
                "videos":
                {
                    "$push": {
                        "_id": "$_id", "videoUrl": "$videoUrl", "timeInterval": "$timeInterval"
                    }
                }
            }
        }

    ], function(error, result){
        if(error){
            logger.error("%s : Error in getVideoRetentionDetails function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of getVideoRetentionDetails function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    })
};

var deleteVideoRetentionDetails = function (videoId, callback) {
    logger.debug("%s : In removeEmptyVideos function", logStr);
    videoRetention.remove({ _id: videoId }, function (error, result) {
        if (error) {
            logger.error("%s : Error in deleteVideoRetentionDetails function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of deleteVideoRetentionDetails function.", logStr);
            callback(null, result);
        }
    });
}

/**This function will return video retention details by video id */
var getVideoRetentionByVideoId = function (videoId, callback) {
    logger.debug("%s : In getVideoRetentionByVideoId function", logStr);
    videoRetention.findOne({ "_id": videoId }, function (error, result) {
            if (error) {
                logger.error("%s : Error in getVideoRetentionByVideoId function : ", logStr, error);
                callback(error, null);
            }
            else {
                logger.debug("%s : Sending Success response of getVideoRetentionByVideoId function.", logStr);
                callback(null, result);
            }
        });
};

/** This function will return list of videos whose retention period is over */
var getExpiredVideos = function (callback) {
    logger.debug("%s : In getExpiredVideos function", logStr);
    var now = new Date();
    var currentTime = Math.round((now.getTime()) / 1000);
    videoRetention.find({ "retentionTimestamp": { $lt: currentTime } }, function (error, result) {
            if (error) {
                logger.error("%s : Error in getExpiredVideos function : ", logStr, error);
                callback(error, null);
                return;
            }
            else {
                logger.debug("%s : Sending Success response of getExpiredVideos function.", logStr);
                callback(null, result);
            }
        });
};

/**This function will remove video retention details by ids */
var removeMultipleVideo = function (videoIdsArray, callback) {
    logger.debug("%s : In removeMultipleVideo function", logStr);
    videoRetention.remove({'_id': {$in: videoIdsArray}}, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeMultipleVideo function : ", logStr, error);
            callback(error, null);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of removeMultipleVideo function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function returns list of cameras selected for retention
 */
var getRetentionCameras = function (req, res) {
    videoRetention.aggregate([
        { "$group": { _id: { camId: "$camId", deviceName: "$deviceName" } } },
        { "$project": { _id: 0, camId: "$_id.camId", deviceName: "$_id.deviceName" } }
    ], function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        res.status(constants.httpStatusCodes.success).send(result);
        return;
    });
}

exports.saveVideoRetention = saveVideoRetention;
exports.getVideoRetentionDetails = getVideoRetentionDetails;
exports.getVideoRetentionByVideoId = getVideoRetentionByVideoId;
exports.getExpiredVideos = getExpiredVideos;
exports.removeMultipleVideo = removeMultipleVideo;
exports.getRetentionCameras = getRetentionCameras;
exports.deleteVideoRetentionDetails = deleteVideoRetentionDetails;