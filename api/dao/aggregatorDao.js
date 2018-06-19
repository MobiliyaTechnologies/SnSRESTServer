var aggregator = require('../models/aggregatorModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'AggregatorDao';

/**
 * This function returns aggregator details by macId
 * @param {object} req 
 * @param {function} callback 
 */
var getAggregatorByMacId = function (req, callback) {
    logger.debug("%s : In getAggregatorByMacId function: macId: " + req.body.macId, logStr);
    aggregator.findOne({ 'macId': req.body.macId }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getAggregatorByMacId function : ", logStr, error);
            callback(error, null);
            return;
        }
        logger.debug("%s : Sending Success response of getAggregatorByMacId function.", logStr);
        callback(null, result);
    });
};

/**
 * This function registers new aggregator
 * @param {object} req 
 * @param {object} res 
 */
var registerAggregator = function (req, res) {
    logger.debug("%s : In registerAggregator function. Received request" + JSON.stringify(req.body), logStr);
    req.body.lastSeen = Math.round(((new Date).getTime()) / 1000);
    aggregator.findOneAndUpdate({ 'macId': req.body.macId }, req.body, { upsert: true, new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in registerAggregator function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of registerAggregator function.", logStr);
        res.status(constants.httpStatusCodes.resourceCreated).send(result);
    });
};

/**
 * This function updates compute engine details
 * @param {object} req Request will contain aggregator id and data to update
 * @param {function} callback Function will return error or success response
 */
var updateAggregator = function (req, res) {
    logger.debug("%s : In updateAggregator function. Received request" + JSON.stringify(req.body), logStr);
    aggregator.findOneAndUpdate({ 'macId': req.body.macId }, req.body, { new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateAggregator function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        if (!result) {
            errorHandler('AggregatorNotFoundError', res);
            return;
        }
        logger.debug("%s : Sending Success response of updateAggregator function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
};

/**
 * This function will return list of whitelisted aggregators
 * @param {object} req 
 * @param {object} res 
 */
var getAllAggregators = function (req, res) {
    logger.debug("%s : In getAllAggregators function", logStr);
    var queryCondition = {};
    if (req.query.status) {
        var status = req.query.status
        var statusArray = status.split(',');
        queryCondition.status = {$in : statusArray};
    }
    if (req.query.aggregatorName) {
        var aggregatorName = req.query.aggregatorName;
        queryCondition.name = { $regex: new RegExp('^' + aggregatorName.toLowerCase(), 'i') };
    }
    aggregator.find(queryCondition, function (error, result) {
        if (error) {
            logger.error("%s : Error in getAllAggregators function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of getAllAggregators function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
};

/**
 * This function will returnn aggregator details by id
 * @param {object} req request will contain compute engine id
 * @param {object} res 
 */
var getAggregatorById = function (req, callback) {
    logger.debug("%s : In getAggregatorById function", logStr);
    aggregator.findOne({ '_id': req.params.id }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getAggregatorById function : ", logStr, error);
            callback(error, null);
            return;
        }
        logger.debug("%s : Sending Success response of getAggregatorById function.", logStr);
        callback(null, result);
    });
};

var removeAggregator = function (req, callback) {
    logger.debug("%s : In removeAggregator function. Received request" + req.params.id, logStr);
    aggregator.remove({ _id: req.params.id }, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeAggregator function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of removeAggregator function.", logStr);
            callback(null, result);
        }
    });
};

var getAggregatorByDate = function (callback) {
    logger.debug("%s : In getAggregatorByDate function", logStr);
    var now = new Date();
    now.setMinutes(now.getMinutes() - constants.cronJobIntervalMinutes);
    var currentTime = Math.round((now.getTime()) / 1000);
    aggregator.find({'lastSeen': {$lt: currentTime}}, function (error, result) {
        if (error) {
            logger.error("%s : Error in getAggregatorByDate function : ", logStr, error);
            callback(error, null);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of getAggregatorByDate function.", logStr);
            callback(null, result);
        }
    });
};

var removeAggregatorByDate = function (aggregatorIds, callback) {
    logger.debug("%s : In removeAggregatorByDate function", logStr);
    aggregator.remove({'_id': {$in: aggregatorIds}}, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeAggregatorByDate function : ", logStr, error);
            callback(error, null);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of removeAggregatorByDate function.", logStr);
            callback(null, result);
        }
    });
};

exports.getAggregatorByMacId = getAggregatorByMacId;
exports.registerAggregator = registerAggregator;
exports.updateAggregator = updateAggregator;
exports.getAllAggregators = getAllAggregators;
exports.getAggregatorById = getAggregatorById;
exports.removeAggregator = removeAggregator;
exports.getAggregatorByDate = getAggregatorByDate;
exports.removeAggregatorByDate = removeAggregatorByDate;