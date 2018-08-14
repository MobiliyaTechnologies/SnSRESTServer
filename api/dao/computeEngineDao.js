var computeEngine = require('../models/computeEngineModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'ComputeEngineDao';

/**
 * This function returns compute engine details by macId
 * @param {object} req 
 * @param {function} callback 
 */
var getComputeEngineByMacId = function (req, callback) {
    logger.debug("%s : In getComputeEngineByMacId function: macId: " + req.body.macId, logStr);
    computeEngine.findOne({ 'macId': req.body.macId }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getComputeEngineByMacId function : ", logStr, error);
            callback(error, null);
            return;
        }
        logger.debug("%s : Sending Success response of getComputeEngineByMacId function.", logStr);
        callback(null, result);
    });
};

/**
 * This function creates/updates compute engines
 * @param {object} req Request contains compute engine details
 * @param {object} res 
 */
var registerComputeEngine = function (req, res) {
    logger.debug("%s : In registerComputeEngine function. Received request" + JSON.stringify(req.body), logStr);
    req.body.lastSeen = Math.round(((new Date).getTime()) / 1000);
    req.body.availability = 0;
    if(req.body.cameraSupported){
        req.body.availability = req.body.cameraSupported;
    }
    computeEngine.findOneAndUpdate({ 'macId': req.body.macId }, req.body, { upsert: true, new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in registerComputeEngine function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of registerComputeEngine function.", logStr);
        res.status(constants.httpStatusCodes.resourceCreated).send(result);
    });
};

/**
 * This functions un-registers algorithm associated with compute engine
 * @param {object} req Request contains compute engine and algorithm id which you want to unreister
 * @param {object} res 
 */
var unregisterAlgorithm = function (req, res) {
    logger.debug("%s : In unregisterAlgorithm function. Received algorithm id" + JSON.stringify(req.params.id), logStr);
    computeEngine.findByIdAndUpdate({ '_id': req.query.computeEngineId }, { $pull: { detectionAlgorithms: { _id: req.params.id } } },
        { new: true }, function (error, result) {
            if (error) {
                logger.error("%s : Error in unregisterAlgorithm function : ", logStr, error);
                errorHandler(error, res);
                return;
            }
            logger.debug("%s : Sending Success response of unregisterAlgorithm function.", logStr);
            res.status(constants.httpStatusCodes.noContent).send();
        });
};

/**
 * This function updates compute engine details
 * @param {object} req Request will contain computeEngineId and data to update
 * @param {function} callback Function will return error or success response
 */
var updateComputeEngine = function (req, callback) {
    logger.debug("%s : In updateComputeEngine function. Received request" + JSON.stringify(req.body), logStr);
    computeEngine.findByIdAndUpdate(req.queryCondition, req.updateData, { new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in update ComputeEngine function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of updateComputeEngine function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function will return list of whitelisted compute engines
 * @param {object} req 
 * @param {object} res 
 */
var getAllComputeEngines = function (req, res) {
    logger.debug("%s : In getAllComputeEngines function", logStr);
    var queryCondition = {};
    if (req.query.status) {
        var status = req.query.status
        var statusArray = status.split(',');
        queryCondition.status = {$in : statusArray};
    }
    if (req.query.computeEngineName) {
        var computeEngineName = req.query.computeEngineName;
        queryCondition.name = { $regex: new RegExp('^' + computeEngineName.toLowerCase(), 'i') };
    }
    computeEngine.find(queryCondition, function (error, result) {
        if (error) {
            logger.error("%s : Error in getAllComputeEngines function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of getAllComputeEngines function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
};

/**
 * This function will returnn compute engine details by id
 * @param {object} req request will contain compute engine id
 * @param {object} res 
 */
var getComputeEngineById = function (req, callback) {
    logger.debug("%s : In getComputeEngineById function", logStr);
    computeEngine.findOne({ '_id': req.params.id }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getComputeEngineById function : ", logStr, error);
            callback(error, null);
            return;
        }
        logger.debug("%s : Sending Success response of getComputeEngineById function.", logStr);
        callback(null, result);
    });
};

/**
 * This function disables or enables algorithm status
 * @param {object} req Request contains algorithm and compute engine id along with status 0/1
 * @param {object} res 
 */
var updateAlgoStatus = function (req, res) {
    logger.debug("%s : In updateAlgoStatus function. Received algoId: " + req.params.id, logStr);
    computeEngine.update({ '_id': req.body.computeEngineId, 'detectionAlgorithms._id': req.params.id }, { $set: { 'detectionAlgorithms.$.status': req.body.status } }
        , function (error, result) {
            if (error) {
                logger.error("%s : Error in update AlgoStatus function : ", logStr, error);
                errorHandler(error, res);
                return
            }
            logger.debug("%s : Sending Success response of updateAlgoStatus function.", logStr);
            res.status(constants.httpStatusCodes.success).send({ "message": "Algorithm status updated" });
        });
};

/**
 * This function will delete compute engine
 * @param {object} req Request contains compute engine id
 * @param {function} callback 
 */
var removeComputeEngine = function (req, callback) {
    logger.debug("%s : In removeComputeEngine function. Received request" + req.params.id, logStr);
    computeEngine.remove({ _id: req.params.id }, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeComputeEngine function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of removeComputeEngine function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function will return distinct and sorted feature name list
 * @param {object} req 
 * @param {object} res 
 */
var getFeatureList = function (req, res) {
    logger.debug("%s : In getFeatureList function", logStr);
    computeEngine.distinct('detectionAlgorithms.featureName', function (error, result) {
        if (error) {
            logger.error("%s : Error in getFeatureList function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of getFeatureList function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result.sort());
    });
};

/**
 * This function will return compute engine list whose last seen is before specific time
 * @param {function} callback 
 */
var getComputeEngineByDate = function(callback){
    logger.debug("%s : In getComputeEngineByDate function", logStr);
    var now = new Date();
    now.setMinutes(now.getMinutes() - constants.cronJobIntervalMinutes);
    var currentTime = Math.round((now.getTime()) / 1000);
    computeEngine.find({'lastSeen': {$lt: currentTime}}, function (error, result) {
        if (error) {
            logger.error("%s : Error in getComputeEngineByDate function : ", logStr, error);
            callback(error, null);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of getComputeEngineByDate function.", logStr);
            callback(null, result);
        }
    });
}

/**
 * This function wil remove compute engine details
 * @param {array} computeEngineIds  Array of compute engine ids
 * @param {function} callback 
 */
var removeComputeEngineByDate = function (computeEngineIds, callback) {
    logger.debug("%s : In removeComputeEngineByDate function", logStr);
    computeEngine.remove({'_id': {$in: computeEngineIds}}, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeComputeEngineByDate function : ", logStr, error);
            callback(error, null);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of removeComputeEngineByDate function.", logStr);
            callback(null, result);
        }
    });
};

/** Return Face compute engine details */
var getFaceComputeEngine = function(callback){
    logger.debug("%s : In getFaceComputeEngine function", logStr);
    computeEngine.find({ "detectionAlgorithms": {$elemMatch : { featureName: "faceRecognition" } } } , function(error, result){
        if(error){
            logger.error("%s : Error in getFaceComputeEngine function : ", logStr, error);
            callback(error, null);
        }
        else{
            logger.debug("%s : Sending Success response of getFaceComputeEngine function.", logStr);
            callback(null, result);
        }
    });
}

exports.getComputeEngineByMacId = getComputeEngineByMacId;
exports.registerComputeEngine = registerComputeEngine;
exports.unregisterAlgorithm = unregisterAlgorithm;
exports.updateComputeEngine = updateComputeEngine;
exports.getAllComputeEngines = getAllComputeEngines;
exports.getComputeEngineById = getComputeEngineById;
exports.updateAlgoStatus = updateAlgoStatus;
exports.removeComputeEngine = removeComputeEngine;
exports.getFeatureList = getFeatureList;
exports.getComputeEngineByDate = getComputeEngineByDate;
exports.removeComputeEngineByDate = removeComputeEngineByDate;
exports.getFaceComputeEngine = getFaceComputeEngine;