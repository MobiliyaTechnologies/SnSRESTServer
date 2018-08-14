var mongoose = require('mongoose');
var camera = require('../models/cameraModel');
var aggregator = require('../models/aggregatorModel');
var computeEngine = require('../models/computeEngineModel');
var fs = require('fs');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'CameraDao';

var addCamera = function (addCameraReq, callback) {
    logger.debug("%s : In addCamera function. Received request: " + JSON.stringify(addCameraReq), logStr);
    camera.create(addCameraReq, function (error, result) {
        if (error) {
            logger.error("%s : Error in addcamera function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s: Camera added", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function will return camera details by devicename and featureName 
 * @param {object} req Request contains deviceName and featureName
 * @param {function} callback callback function will return error or success response
 */
var getCameraDetails = function (req, callback) {
    logger.debug("%s : In getCameraDetails function", logStr);
    camera.findOne(req.queryCondition, function (error, result) {
        if (error) {
            logger.error("%s : Error in getCameraDetails function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of getCameraDetails function.", logStr);
            callback(null, result);
        }
    }).populate({ path: 'aggregator', model: aggregator }).populate({ path: 'computeEngine', model: computeEngine })
};

/**
 * This function will update bounding box of camera
 * @param {object} req Request contains deviceName and featureName
 * @param {function} callback callback function will return error or success response
 */
var setBoundingBox = function (req, callback) {
    logger.debug("%s : In setBoundingBox function. Received request: " + req.body.deviceName, logStr);
    camera.findOneAndUpdate({ 'deviceName': req.body.deviceName },
        { $set: { 'boundingBox': req.body.Coords }, 'feature': req.body.feature, 'imageHeight': req.body.imageHeight, 
        'imageWidth': req.body.imageWidth, 'frameWidth': req.body.frameWidth.width, 'frameHeight': req.body.frameWidth.height , 'coordinates': req.body.coordinates}, { upsert: true, new: true }, function (error, result) {
            if (error) {
                logger.error("%s : Error in setBoundingBox function : ", logStr, error);
                callback(error, null);
            }
            else {
                logger.debug("%s : Sending Success response of setBoundingBox function.", logStr);
                callback(null, result);
            }
        });
};

/**
 * This function will retrieve camera list by feature name 
 * @param {object} req Request contains featureName
 * @param {function} callback callback callback function will return error or success response
 */
var retrieveCamera = function (req, callback) {
    logger.debug("%s : In retrieveCamera function", logStr);
    var queryCondition = {};
    if (req.query.status) {
        queryCondition.status = req.query.status;
    }
    if (req.query.deviceName) {
        var deviceName = req.query.deviceName;
        queryCondition.deviceName = { $regex: new RegExp('^' + deviceName.toLowerCase(), 'i') };
    }
    if(req.query.feature){
        queryCondition.feature = req.query.feature;
    }

    camera.find(queryCondition, function (error, result) {
        if (error) {
            logger.error("%s : Error in retrieveCamera function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of retrieveCamera function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function will update camera status 
 * @param {*} req Request contains deviceName
 * @param {*} callback callback will return success or error response
 */
var updateCameraStatus = function (req, callback) {
    logger.debug("%s : In updateCameraStatus function", logStr);
    var queryCondition = {};
    if (req.body.deviceName) {
        queryCondition.deviceName = req.body.deviceName;
    }
    camera.findOneAndUpdate(queryCondition, {$set:{ 'status': req.body.status }}, { new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateCameraStatus function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of updateCameraStatus function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function will remove camera details
 * @param {object} req Request contains camera id
 * @param {function} callback callback will return success or error response
 */
var deleteCamera = function (req, callback) {
    logger.debug("%s : In deleteCamera function. Received request" + req.params.id, logStr);
    camera.remove({ _id: req.params.id }, function (error, result) {
        if (error) {
            logger.error("%s : Error in deleteCamera function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of deleteCamera function.", logStr);
            callback(null, result);
        }
    });
};

/**
 * This function returns device details by device name
 * @param {object} req Request contains deviceName
 * @param {object} res Success Response with device details
 */
var getCameraDetailsByName = function (req, res) {
    camera.findOne({ 'deviceName': req.query.deviceName }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getCameraDetailsByName function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        if (!result) {
            logger.error("%s : Device not found error in getCameraDetailsByName function : ", logStr);
            errorHandler('CameraNotFoundError', res);
            return;
        }
        logger.debug("%s : Sending Success response of getCameraDetailsByName function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
};

/**
 * This function will update device details
 * @param {object} req Request contains device id along with details to be updated
 * @param {object} res Response contains success response with device details
 */
var updateCamera = function (req, res) {
    logger.debug("%s : In updateCamera function", logStr);
    camera.findByIdAndUpdate({ '_id': req.params.id }, req.body, { new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateCamera function : ", logStr, error);
            errorHandler(error, res);
        }
        logger.debug("%s : Sending Success response of updateCamera function.", logStr);
        res.status(constants.httpStatusCodes.success).send({'message' : 'camera detials updated'});
    });
};

/**
 * This function will updated isPlotted status for given cameras
 * @param {object} req Request contains array of cameras
 * @param {object} res Response contains success response
 */
var plotCameras = function (req, res) {
    logger.debug("%s : In plotCameras function. Received request: " + req.query.camIds, logStr);
    var camIds = req.query.camIds;
    var camIdArray = camIds.split(',');
    camera.update({ '_id': { $in: camIdArray.map(function (o) { return mongoose.Types.ObjectId(o); }) } }, req.body, { multi: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in plotCameras function : ", logStr, error);
            errorHandler(error, res);
        }
        else {
            logger.debug("%s : Sending Success response of plotCameras function.", logStr);
            res.status(constants.httpStatusCodes.success).send({ 'message': 'Camera plotted' });
        }
    });
}

/**
 * This function will return camera count by feature
 * @param {*} req 
 * @param {*} res Response contains fetures along with camera count
 */
var getLiveCameraCountByFeature = function (req, res) {
    logger.debug("%s : In getLiveCameraCountByFeature function", logStr);
    camera.aggregate([
        { "$group": { _id: "$feature", count: { $sum: 1 }, feature: { $first: "$feature" } } }
    ], function (error, result) {
        if (error) {
            logger.error("%s : Error in getLiveCameraCountByFeature function : ", logStr, error);
            errorHandler(error, res);
        }
        else {
            logger.debug("%s : Sending Success response of getLiveCameraCountByFeature function.", logStr);
            res.status(constants.httpStatusCodes.success).send(result);
        }
    });
};

/**
 * This fucntion will return cameras list by aggregator or feature filter
 * @param {object} req Request contains filter or device name 
 * @param {object} res Response contains camera results group by aggregator or features
 */
var getCamerasByAggregators = function (req, res) {
    logger.debug("%s : In getCamerasByAggregators function", logStr);
    var queryCondition = [];
    if (req.query.deviceName && req.query.deviceName != 'null') {
        queryCondition.push({ '$match': { deviceName: { $regex: new RegExp('^' + req.query.deviceName, 'i') } } });
    }

    if (req.query.filter && req.query.filter === 'aggregator') {
        queryCondition.push(
            {
                $match: {
                    $or: [
                        { __type: { $eq: 'aggregatorDetails' } },
                        { __type: { $eq: 'cameraDetails' } }
                    ]
                }
            },
            { $lookup: { from: "snsdata", localField: "aggregator", foreignField: "_id", as: "aggregatorDetails" } },
            { $unwind: "$aggregatorDetails" },
            {
                $group: {
                    "_id": "$aggregatorDetails", "cameras":
                    {
                        "$push": {
                            "camId": "$_id", "deviceName": "$deviceName", "isPlotted": "$isPlotted",
                            "deviceType": "$deviceType", "streamingUrl": "$streamingUrl", "status": "$status",
                            "computeEngine": "$computeEngine", "aggregator": "$aggregator", "boundingBox": "$boundingBox",
                            "feature": "$feature", "imageHeight": "$imageHeight", "imageWidth": "$imageWidth",
                            "location": "$location"
                        }
                    }
                }
            },
            { $project: { "filter": "$_id.name", "cameras": 1, _id: 0 } });
    }
    else {
        queryCondition.push(
            {
                "$group": {
                    "_id": "$feature", "cameras": {
                        "$push":
                        {
                            "camId": "$_id", "deviceName": "$deviceName", "isPlotted": "$isPlotted",
                            "deviceType": "$deviceType", "streamingUrl": "$streamingUrl", "status": "$status",
                            "computeEngine": "$computeEngine", "aggregator": "$aggregator", "boundingBox": "$boundingBox",
                            "feature": "$feature", "imageHeight": "$imageHeight", "imageWidth": "$imageWidth",
                            "location": "$location"
                        }
                    }
                }
            },
            { $project: { "filter": "$_id", "cameras": 1, _id: 0 } }
            )
    }

    camera.aggregate(queryCondition, function (error, result) {
        if (error) {
            logger.error("%s : Error in getCamerasByAggregators function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of getCamerasByAggregators function.", logStr);
            if (req.query.filter && req.query.filter === 'aggregator') {
                getOtherCategorycamera(result,res)
                return;
            }
            else{
                res.status(constants.httpStatusCodes.success).send(result);
            }
        }
    });
}

/**
 * This function will return cameras with aggregator id null
 * @param {object} result 
 * @param {object} res Response contains camera list whose aggregator id is null
 */
var getOtherCategorycamera = function(result, res){
    logger.debug("%s: In getOtherCategorycamera function", logStr);
    camera.find({ 'aggregator': null } ,function (error, otherResult) {
        if (error) {
            logger.error("%s : Error in getOtherCategorycamera function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
         logger.debug("%s : Sending Success response of getOtherCategorycamera function.", logStr);
         otherAggrResult = {};
         otherAggrResult.filter = 'Other';
         otherAggrResult.cameras = otherResult;

         if(otherResult.length > 0){
             var cameras = [];
            otherResult.forEach(function (cam, index) {
                var cameraObject = {};
                cameraObject.camId = cam._id;
                cameraObject.deviceType = cam.deviceType;
                cameraObject.deviceName = cam.deviceName;
                cameraObject.streamingUrl = cam.streamingUrl;
                cameraObject.status = cam.status;
                cameraObject.computeEngine = cam.computeEngine;
                cameraObject.aggregator = cam.aggregator;
                cameraObject.imageHeight = cam.imageHeight;
                cameraObject.imageWidth = cam.imageWidth;
                cameraObject.frameWidth = cam.frameWidth;
                cameraObject.frameHeight = cam.frameHeight;
                cameraObject.coordinates = cam.coordinates;
                cameraObject.isPlotted = cam.isPlotted;
                cameraObject.boundingBox = cam.boundingBox;
                cameraObject.feature = cam.feature;
                cameraObject.location = cam.location;
                cameraObject.lastSeen = cam.lastSeen;
                cameras.push(cameraObject);

                if (index === otherResult.length - 1) {
                    otherAggrResult.cameras = cameras;
                    result.push(otherAggrResult);
                    res.status(constants.httpStatusCodes.success).send(result);
                }
            });
         }
         else{
            res.status(constants.httpStatusCodes.success).send(result);
         }
    });
}

/**
 * This function will return if marker name is valid or not
 * @param {function} callback 
 */
var validateMarker = function(callback){
    logger.debug("%s : In validateMarker function dao", logStr);
    camera.find({},function (error, result) {
        if (error) {
            logger.error("%s : Error in validateMarker function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of validateMarker function.", logStr);
            callback(null, result);
        }
    });
}

/**
 * This function will return camera details by camera id
 * @param {string} camId camera id
 * @param {function} callback 
 */
var getCamerasByCameraId = function(camId, callback){
    logger.debug("%s : In getCamerasByCameraId function. camId: "+ camId, logStr);
    camera.find({_id: {$in: camId}},function (error, result) {
        if (error) {
            logger.error("%s : Error in getCamerasByCameraId function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of getCamerasByCameraId function.", logStr);
            callback(null, result);
        }
    });
}

/**
 * This fucntion will return list of all bounding boxes
 * @param {object} req 
 * @param {object} res 
 */
var getAllBoundingBoxes = function(req, res){
    logger.debug("%s : In getAllBoundingBoxes function", logStr);
    var aggregateReq = [];
    if(req.query.status){
        aggregateReq.push({$match : {status: req.query.status}});
    }
    
    aggregateReq.push({ $unwind : "$boundingBox" } ,
    {"$group" : {_id:"$boundingBox.markerName" , camId:{$first: "$_id"}}},
    {"$project" : {"_id":0 , "markerName": "$_id" , camId: 1}});

    camera.aggregate(aggregateReq, function(error, result){
        if(error){
            logger.error("%s : Error in getCamerasByCameraId function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        res.status(constants.httpStatusCodes.success).send(result);
    });
}

/**
 * Update camera status if aggregator or computeengine is down
 * @param {object} req Request contains aggregator or computeengine ids
 * @param {function} callback 
 */
var updateCameraStatusAggrCompute = function(req, callback){
    logger.debug("%s : In updateCameraStatusAggrCompute function", logStr);
    var queryCondition = {};
    var updateReq = {'status': '0'};
    if(req.query.computeEngineIds){
        queryCondition.computeEngine = { $in: req.query.computeEngineIds };
        updateReq.computeEngine = null;
    }
    else{
        queryCondition.aggregator = { $in: req.query.aggregatorIds };
        updateReq.aggregator = null;
    }
    
    camera.update(queryCondition, updateReq, { multi: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateCameraStatusAggrCompute function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of updateCameraStatusAggrCompute function.", logStr);
            callback(null, result);
        }
    });
}

/**
 * This function will return cameras by aggregator or compute engine
 * @param {object} req Request contains aggregator or computeengine ids
 * @param {function} callback 
 */
var getCamerasByAggrCompute = function(req, callback){
    logger.debug("%s : In getCamerasByAggrCompute function. " , logStr);    
    var queryCondition = {};
    if(req.query.computeEngineIds){
        queryCondition.computeEngine = { $in: req.query.computeEngineIds };
    }
    else{
        queryCondition.aggregator = { $in: req.query.aggregatorIds };
    }
    camera.find(queryCondition, function (error, result) {
        if (error) {
            logger.error("%s : Error in getCamerasByAggrCompute function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of getCamerasByAggrCompute function.", logStr);
            callback(null, result);
        }
    });
}

exports.setBoundingBox = setBoundingBox;
exports.getCameraDetails = getCameraDetails;
exports.retrieveCamera = retrieveCamera;
exports.updateCameraStatus = updateCameraStatus;
exports.deleteCamera = deleteCamera;
exports.addCamera = addCamera;
exports.getCameraDetailsByName = getCameraDetailsByName;
exports.updateCamera = updateCamera;
exports.plotCameras = plotCameras;
exports.getLiveCameraCountByFeature = getLiveCameraCountByFeature;
exports.getCamerasByAggregators = getCamerasByAggregators;
exports.validateMarker = validateMarker;
exports.getCamerasByCameraId = getCamerasByCameraId;
exports.getAllBoundingBoxes = getAllBoundingBoxes;
exports.updateCameraStatusAggrCompute = updateCameraStatusAggrCompute;
exports.getCamerasByAggrCompute = getCamerasByAggrCompute;