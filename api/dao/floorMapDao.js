var floorMap = require('../models/floorMapModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'FloorMapDao';

/**
 * This function will save floor map details in database
 * @param {object} req Request contains floor map details
 * @param {object} res Response will return success response
 */
var createFloorMap = function (req,res) {
    logger.debug("%s : In createFloorMap function", logStr);
    floorMap.create(req.body, function (error, result) {
        if (error) {
            logger.error("%s : Error in createFloorMap function : ", logStr, error);
            errorHandler(error,res);
            return;
        }
        logger.debug("%s : Sending Success response of createFloorMap function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
};

/**
 * This function will update floor map details in database
 * @param {object} req Request contains floor map details
 * @param {object} res Response will return success response
 */
var updateFloorMap = function (req,res) {
    logger.debug("%s : In updateFloorMap function.Received id: "+ req.params.id, logStr);
    floorMap.findByIdAndUpdate({ '_id': req.params.id }, req.body, { new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateFloorMap function : ", logStr, error);
            errorHandler(error, res);
        }
        logger.debug("%s : Sending Success response of updateFloorMap function.", logStr);
        res.status(constants.httpStatusCodes.success).send({'message': 'Floor map updated'});
    });
};

/**
 * This function will return all floor map
 * @param {object} req Request
 * @param {object} res Response will return floor map details
 */
var getFloorMap = function(req, callback){
    logger.debug("%s : In getFloorMap function" , logStr);
    floorMap.find({}, function (error, result) {
        if (error) {
            logger.error("%s : Error in getFloorMap function : ", logStr, error);
            callback(error, null);
        }
        else{
            logger.debug("%s : Sending Success response of getFloorMap function.", logStr);
            callback(null, result);
        }
    }).sort({'name': 1});
};

/**
 * This function will remove floor map from database
 * @param {object} req Request will contain id of floor map to be removed
 * @param {object} res 
 */
var deleteMap = function(req, res){
    logger.debug("%s : In deleteMap function" , logStr);
    floorMap.remove({_id: req.params.id},function(error, result){
        if (error) {
            logger.error("%s : Error in deleteMap function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of deleteMap function.", logStr);
        res.status(constants.httpStatusCodes.noContent).send();
    });
};


var findCameraOnMap = function(camId, callback){
    logger.debug("%s : In findCameraOnMap function. Received camId: " + camId , logStr);
    floorMap.findOne({'cameras.camId': camId}, function(error, result){
        if(error){
            logger.error("%s : Error in findCameraOnMap function : ", logStr, error);
            callback(error, null);
        }
        else{
            logger.debug("%s : Sending Success response of findCameraOnMap function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This is cascade function used to soft delete cameras on floor map
 * @param {String} camId 
 * @param {function} callback 
 */
var removeCameraOnMap = function(mapId, camIdArray, callback){
    logger.debug("%s : In removeCameraOnMap function. Received camId: " + camIdArray , logStr);
    floorMap.findOneAndUpdate({'_id': mapId}, {'$set': {'cameras': camIdArray}},
         function(error, result){
        if(error){
            logger.error("%s : Error in removeCameraOnMap function : ", logStr, error);
            callback(error, null);
        }
        else{
            logger.debug("%s : Sending Success response of removeCameraOnMap function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function will return floor map details by layout name
 * @param {object} req Request
 * @param {object} res Response will return floor map details
 */
var getFloorMapByName = function(req, callback){
    logger.debug("%s : In getFloorMapByName function" , logStr);
    floorMap.findOne({'name': req.query.mapName }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getFloorMapByName function : ", logStr, error);
            callback(error, null);
            return;
        }
        else{
            logger.debug("%s : Sending Success response of getFloorMapByName function.", logStr);
            callback(null, result);
        }
    });
};

exports.createFloorMap = createFloorMap;
exports.updateFloorMap = updateFloorMap;
exports.getFloorMap = getFloorMap;
exports.deleteMap = deleteMap;
exports.getFloorMapByName = getFloorMapByName;
exports.findCameraOnMap = findCameraOnMap;
exports.removeCameraOnMap = removeCameraOnMap;