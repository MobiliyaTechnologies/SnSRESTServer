var powerBiDetails = require('../models/powerbiModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'PowerBiObject';

/**
 * This function will save powerBi details in database
 * @param {object} req Request contains powerBi details
 * @param {object} res Response will return success response
 */
var savePowerBiDetails = function (req, res) {
    logger.debug("%s : In savePowerBiDetails function", logStr);
    powerBiDetails.findOneAndUpdate({ 'confName': req.body.confName }, req.body, { upsert: true, new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in savePowerBiDetails function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of savePowerBiDetails function.", logStr);
        res.status(constants.httpStatusCodes.resourceCreated).send({ 'message': 'success' });
    });
};

/**
 * This function will return powerBi details
 * @param {object} req Request
 * @param {object} res Response will return powerBi details
 */
var getPowerBiDetails = function (req, callback) {
    logger.debug("%s : In getPowerBiDetails function", logStr);
    powerBiDetails.findOne({ 'confName': req.query.confName }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getPowerBiDetails function : ", logStr, error);
            callback(error, null);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of getPowerBiDetails function.", logStr);
            callback(null, result);
        }
    })
};

exports.savePowerBiDetails = savePowerBiDetails;
exports.getPowerBiDetails = getPowerBiDetails;