var mongoose = require('mongoose');
var cameraProfile = require('../models/cameraProfileModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'CameraProfileDao';

/**
 * This function creates cameraProfile
 * @param {object} req 
 */
var registerCameraProfile = function (req) {
    logger.debug("%s : In registerCameraProfile function: cameraId: " + req.cameraId, logStr);
    cameraProfile.findOneAndUpdate({ 'cameraId': req.cameraId }, req, { upsert: true, new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in registerCameraProfile function : ", logStr, error);
            return;
        }
        logger.debug("%s : Sending Success response of registerCameraProfile function.", logStr);
    });
};

/**
 * This function returns camera profiles by id
 * @param {object} req 
 * @param {object} res 
 */
var getCameraProfile = function (req, res) {
    logger.debug("%s : In getCameraProfile function: cameraId: " + req.query.camIds, logStr);
    var camIds = req.query.camIds;
    var camIdArray = camIds.split(',');
    cameraProfile.find({ 'cameraId': { $in: camIdArray } }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getCameraDetailsByName function : ", logStr, error);
            errorHandler(error, res);
        }
        else {
            logger.debug("%s : Sending Success response of getCameraDetailsByName function.", logStr);
            res.status(constants.httpStatusCodes.success).send(result);
        }
    });
};

exports.registerCameraProfile = registerCameraProfile;
exports.getCameraProfile = getCameraProfile;