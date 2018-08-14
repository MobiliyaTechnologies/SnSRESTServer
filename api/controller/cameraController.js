var fs = require('fs');
var exec = require('child_process').exec;
var mongoose = require('mongoose');
var cameraProfileController = require('../controller/cameraProfileController');
var cameraDao = require('../dao/cameraDao');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var iotHubClient = require('../iothub/iotHubClient').iotHubClient;
var Message = require('azure-iot-common').Message;
var iotHubErrorHandler = require('../helpers/iotHubErrorHandler').sendMessageCallback;
var logger = require('../logger/index').logger;
var server = require('../../server');
var computeEngineDao = require('../dao/computeEngineDao');
var floorMapController = require('./floorMapController');
var resultDao = require('../dao/resultDao');
var objectId = mongoose.Schema.ObjectId;
var io = require('../socket/socket').socketIo;
var logStr = 'CameraController';

var mobileCamMap = server.mobileCamMap;
var streamingReqMap = server.streamingReqMap;
var triplineCamMap = server.triplineCamMap;
var userIdentifiedMap = server.userIdentifiedMap;

/**
 * This function will create a new device in database and emits an event on socket
 */
var addCamera = function (req, res) {
    logger.debug("%s : In addcamera function. Received request: " + JSON.stringify(req.body), logStr);
    var cameraData = req.body;
    var userId = cameraData.camdetails.userId;
    var addCameraResponseTopic = 'addCameraResponse/' + userId;
    var addCameraRes = {
        'deviceName': cameraData.camdetails.deviceName,
        'userId': userId
    }

    if (cameraData.flag == 1) {
        var addCameraReq = {
            deviceType: cameraData.camdetails.deviceType,
            deviceName: cameraData.camdetails.deviceName,
            streamingUrl: cameraData.camdetails.streamingUrl,
            status: '0',
            computeEngine: cameraData.camdetails.computeEngineId,
            aggregator: cameraData.camdetails.aggregatorId,
            location: cameraData.camdetails.location
        };

        cameraDao.addCamera(addCameraReq, function (error, result) {
            if (error) {
                logger.error("%s : Error in addcamera function : ", logStr, error);
                addCameraRes.status = '0';
                io.emit(addCameraResponseTopic, {
                    message: addCameraRes
                });
                errorHandler(error, res);
                return;
            }
            logger.debug("%s: Camera added", logStr);
            addCameraRes.status = 1;
            addCameraRes.cameraId = result._id;
            io.emit(addCameraResponseTopic, {
                message: addCameraRes
            });
        });
    }
    else if (cameraData.flag == 0) {
        addCameraRes.status = '0';
        io.emit(addCameraResponseTopic, {
            message: addCameraRes
        });
    }
    else {
        logger.error("%s: Invalid camera flag", logStr);
    }
    res.status(constants.httpStatusCodes.success).send({'message': 'success'});
}

/** retrieve bounding box details from database */
var getCameraById = function (req, res) {
    req.queryCondition = { _id: req.params.id }
    cameraDao.getCameraDetails(req, function (error, result) {
        if (error) {
            logger.error("%s : Error in getCameraById : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        if (!result) {
            logger.error("%s : Camera not found error in getCameraById", logStr);
            errorHandler('CameraNotFoundError', res);
            return;
        }
        logger.debug("%s : Sending Success response of getCameraById function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
};

/** Update bounding boxes in database and send request for startStreaming */
var setBoundingBox = function (req, res) {
    logger.debug("%s : In setBoundingBox function.", logStr);
    cameraDao.setBoundingBox(req, function (error, result) {
        if (error) {
            logger.error("%s : Error in setBoundingBox : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        delete req.body.Coords;
        req.body.boundingBox = result.boundingBox;
        logger.debug("%s : Sending Success response of setBoundingBox function.", logStr);
        res.status(constants.httpStatusCodes.success).send({'message': 'Bounding box updated'});
        return;
    });
}

/** If device with given details already exists, then send details of it
* else publish request on checkCamera topic to create new device
*/
var validateCamera = function (req, res) {
    logger.debug("%s : In validateCamera function. Received request: " + JSON.stringify(req.body), logStr);
    req.queryCondition = { 'deviceName': req.body.deviceName };
    cameraDao.getCameraDetails(req, function (error, result) {
        if (error) {
            logger.error("%s : Error in validateCamera : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        if (!result) {
            req.body.userId = req.headers['userid'];
            var message = new Message(JSON.stringify(req.body));
            message.ack = 'full';
            message.messageId = "checkCamera";
            iotHubClient.send(req.body.aggregatorId, message, iotHubErrorHandler('send'));
            logger.error("%s : Camera not found error in validateCamera", logStr);
            res.status(constants.httpStatusCodes.resourceCreated).send({ "message": 'Device not found,sent request to aggregator', 'status': constants.httpStatusCodes.resourceCreated });
            return;
        }
        logger.debug("%s : Sending Success response of validateCamera function.", logStr);
        res.status(constants.httpStatusCodes.conflict).send(result);
    });
}

/** This function retrieves list of cameras and request live status to aggregator */
var retrieveCamera = function (req, res) {
    cameraDao.retrieveCamera(req, function (error, result) {
        if (error) {
            logger.error("%s : Error in retrieveCamera : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of retrieveCamera function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
}

/** Update compute engine availability value */
var increaseComputeEngineAvilability = function (req, res, camResult) {
    var updateAvailabilityReq = {
        'queryCondition': { '_id': req.body.computeEngineId },
        'updateData': { $inc: { availability: req.body.boundingBoxLength } }
    }
    computeEngineDao.updateComputeEngine(updateAvailabilityReq, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        var camIdArray = [];
        camIdArray.push(req.body.camId);
        var message = new Message(JSON.stringify(camIdArray));
        message.ack = 'full';
        message.messageId = "stopCamera";
        triplineCamMap.delete(req.body.camId);
        var stopCameraRes = {
            'cameraId': req.body.camId,
            'deviceName': req.body.deviceName
        }
        io.emit('cameraStopRes', {
            message: stopCameraRes
            
        });
        if(camResult.feature === 'faceRecognition' || camResult.feature === 'textRecognition' || camResult.feature === 'faceDetection'){
            userIdentifiedMap.set(req.body.camId, []);
            iotHubClient.send(req.body.aggregatorId, message, iotHubErrorHandler('send'));
            res.status(constants.httpStatusCodes.success).send({ 'message': 'Camera status updated' });
            return;
        }
        iotHubClient.send(req.body.aggregatorId, message, iotHubErrorHandler('send'));
        iotHubClient.send(req.body.computeEngineId, message, iotHubErrorHandler('send'));
        logger.debug("%s : Sending Success response of resetCameraStatus function.", logStr);
        res.status(constants.httpStatusCodes.success).send({ 'message': 'Camera status updated' });
        return;
    });
}

/** Update compute engine availability */
var updateComputeEngineAvailability = function (updateAvailabilityReq, req, res, startStreamingReq) {
    computeEngineDao.updateComputeEngine(updateAvailabilityReq, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of updateComputeEngineAvailability function.", logStr);
        req.body.deviceName = startStreamingReq.deviceName;
        updateCameraStatus(req, function (error, result) {
            if (error) {
                errorHandler(error, res);
                return;
            }
            startStreamingReq.userId = req.headers['userid'];
            var message = new Message(JSON.stringify(startStreamingReq));
            message.ack = 'full';
            message.messageId = "startStreaming";
            if (req.body.deviceType && (req.body.deviceType === constants.mobileImageType || req.body.deviceType === constants.mobile360ImageType)) {
                var streamingUrl = startStreamingReq.streamingUrl;
                if (streamingUrl.toLowerCase().indexOf("_360") >= 0) {
                    iotHubClient.send(req.body.aggregatorId, message, iotHubErrorHandler('send'));
                    iotHubClient.send(req.body.computeEngineId, message, iotHubErrorHandler('send'));
                }
                res.status(constants.httpStatusCodes.success).send({ 'message': 'Camera status updated' });
                return;
            }
            if (startStreamingReq.boundingBox && startStreamingReq.boundingBox[0].shape === 'Line') {
                iotHubClient.send(req.body.computeEngineId, message, iotHubErrorHandler('send'));
                iotHubClient.send(req.body.aggregatorId, message, iotHubErrorHandler('send'));
                triplineCamMap.set(req.body.camId, 0);
                res.status(constants.httpStatusCodes.success).send({ 'message': 'Camera status updated' });
                return;
            }
            else if (startStreamingReq.feature === 'faceRecognition' || startStreamingReq.feature === 'textRecognition' || startStreamingReq.feature === 'faceDetection') {
                userIdentifiedMap.delete(req.body.camId);
                iotHubClient.send(req.body.aggregatorId, message, iotHubErrorHandler('send'));
                res.status(constants.httpStatusCodes.success).send({ 'message': 'Camera status updated' });
                return;
            }
            iotHubClient.send(req.body.aggregatorId, message, iotHubErrorHandler('send'));
            iotHubClient.send(req.body.computeEngineId, message, iotHubErrorHandler('send'));
            res.status(constants.httpStatusCodes.success).send({ 'message': 'Camera status updated' });
            return;
        });
    });
}

var getStartStreamingCameraDetails = function (req, res, result) {
    req.queryCondition = { '_id': req.body.camId };
    cameraDao.getCameraDetails(req, function (error, cameraResult) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        var boundingBoxLength = (cameraResult.boundingBox).length;
        if (boundingBoxLength > result.availability) {
            res.status(constants.httpStatusCodes.tooManyRequests).send({ 'message': 'Compute engine is busy. Please use another one' });
            return;
        }
        else {
            var detectionAlgorithms = cameraResult.computeEngine.detectionAlgorithms;
            var index = detectionAlgorithms.findIndex(obj => obj.featureName == cameraResult.feature);
            var startStreamingReq = {
                "boundingBox": cameraResult.boundingBox,
                "frameWidth": {
                    "width": cameraResult.frameWidth,
                    "height": cameraResult.frameHeight
                },
                "imageHeight": cameraResult.imageHeight,
                "imageWidth": cameraResult.imageWidth,
                "feature": cameraResult.feature,
                "deviceType": cameraResult.deviceType,
                "camId": req.body.camId,
                "streamingUrl": cameraResult.streamingUrl,
                "deviceName": cameraResult.deviceName,
                "aggregatorId": cameraResult.aggregator._id,
                "computeEngineId": cameraResult.computeEngine._id,
                "jetsonCamFolderLocation": cameraResult.computeEngine.jetsonCamFolderLocation,
                "wayToCommunicate": cameraResult.computeEngine.wayToCommunicate,
                "computeEngineFps": cameraResult.computeEngine.detectionAlgorithms[index].fps,
                "sendImagesFlag": req.body.sendImagesFlag,
                "retentionPeriod":req.body.retentionPeriod,
                "videoName": req.body.videoName
            };

            updateAvailabilityReq = {
                'queryCondition': { '_id': result._id },
                'updateData': { 'availability': result.availability - boundingBoxLength }
            }
            updateComputeEngineAvailability(updateAvailabilityReq, req, res, startStreamingReq);
        }
    });
}

/** Check if compute engine is available for cameras for streaming or not */
var checkComputeEngineAvailability = function (req, res) {
    var updateAvailabilityReq = {};
    computeEngineDao.getComputeEngineById(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (!result) {
            errorHandler('ComputeEngineNotFoundError', res);
            return;
        }
        if (result.availability === 0) {
            res.status(constants.httpStatusCodes.tooManyRequests).send({ 'message': 'Compute engine is busy. Please use another one' });
            return;
        }
        else if (result.availability > 0) {
            getStartStreamingCameraDetails(req, res, result);
        }
    });
}

var updateCameraStatus = function (req, callback) {
    cameraDao.updateCameraStatus(req, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateCameraStatus : ", logStr, error);
            callback(error, null);
            return;
        }
        callback(null, result);
    });
}

/** Update device status to start/stop device */
var startStopCamera = function (req, res) {
    logger.debug("%s : In startStopCamera function. Received request: " + JSON.stringify(req.body), logStr);
    if (req.body.status == 1) {
        if (req.body.deviceType && (req.body.deviceType === constants.mobileImageType || req.body.deviceType === constants.mobile360ImageType)) {
            mobileCamMap.set(req.body.camId, true);
        }
        req.params.id = req.body.computeEngineId;
        checkComputeEngineAvailability(req, res);
        return;
    }
    else {
        if (req.body.deviceType && (req.body.deviceType === constants.mobileImageType || req.body.deviceType === constants.mobile360ImageType)) {
            mobileCamMap.delete(req.body.camId);
        }
        updateCameraStatus(req, function (error, result) {
            if (error) {
                logger.error("%s : Error in startStopCamera : ", logStr, error);
                errorHandler(error, res);
                return;
            }
            req.body.boundingBoxLength = (result.boundingBox).length;
            req.params.id = req.body.computeEngineId;
            increaseComputeEngineAvilability(req, res, result);
        });
    }
}

/** Publish request for raw image on getRawImage topic*/
var getRawImage = function (req, res) {
    logger.debug("%s : In getRawImage function. Received request: " + JSON.stringify(req.body), logStr);
    req.body.userId = req.headers['userid'];
    var message = new Message(JSON.stringify(req.body));
    message.ack = 'full';
    message.messageId = "getRawImage";
    iotHubClient.send(req.body.aggregatorId, message, iotHubErrorHandler('send'));
    res.status(constants.httpStatusCodes.success).send({ "message": "Request sent to aggregator", status: constants.httpStatusCodes.success });
}

/** Delete camera from database and publish same device id on stopCamera topic */
var deleteCamera = function (req, res) {
    cameraDao.deleteCamera(req, function (error, result) {
        if (error) {
            logger.error("%s : Error in deleteCamera function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        //delete floor map
        floorMapController.findAndRemoveCameraOnMap(req.params.id, function (error, result) {
            if (error) {
                logger.error("%s : Error in findAndRemoveCameraOnMap function : ", logStr, error);
                errorHandler(error, res);
                return;
            }
            logger.debug("%s : Sending Success response of deleteCamera function.", logStr);
            res.status(constants.httpStatusCodes.noContent).send();
            var cameraIdArray = [];
            cameraIdArray.push(req.params.id);
            var message = new Message(JSON.stringify(cameraIdArray));
            message.ack = 'full';
            message.messageId = "stopCamera";
            triplineCamMap.delete(req.params.id);
            iotHubClient.send(req.body.aggregatorId, message, iotHubErrorHandler('send'));
            iotHubClient.send(req.body.computeEngineId, message, iotHubErrorHandler('send'));
        });
    });
}

/**Mobile app will send device name to retrieve camera details */
var getCameraDetailsByName = function (req, res) {
    logger.debug("%s : In getCameraDetailsByName function. Received deviceName: " + req.query.deviceName, logStr);
    cameraDao.getCameraDetailsByName(req, res);
}

var updateCamera = function (req, res) {
    if (!req.body.deviceName) {
        cameraDao.updateCamera(req, res);
        return;
    }
    req.queryCondition = { 'deviceName': req.body.deviceName }
    cameraDao.getCameraDetails(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (result) {
            var camId = (result._id).toString();
            if (camId !== req.params.id) {
                res.status(constants.httpStatusCodes.conflict).send(result)
                return;
            }
            cameraDao.updateCamera(req, res);
            return;
        }
        cameraDao.updateCamera(req, res);
        return;
    });
}

var plotCameras = function (req, res) {
    if (!req.query.camIds) {
        errorHandler('UnprocessableEntity', res);
        return;
    }
    cameraDao.plotCameras(req, res);
}

var getLiveCameraCountByFeature = function (req, res) {
    cameraDao.getLiveCameraCountByFeature(req, res);
}

var getCamerasByAggregators = function (req, res) {
    cameraDao.getCamerasByAggregators(req, res);
}

var validateMarker = function (req, res) {
    logger.debug("%s : In validateMarker function. markerName: " + req.query.markerName, logStr);
    var marker = req.query.marker;
    var markerFlag = false;
    if (typeof marker !== "string") {
        logger.debug("%s : In validateMarker function", logStr);
        res.status(constants.httpStatusCodes.badRequest).send({ "result": "Invalid marker name." });
        return;
    }
    cameraDao.validateMarker(function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        result.forEach(function (cam, index) {
            cam.boundingBox.forEach(function (bbox) {
                if (marker === bbox.markerName) {
                    markerFlag = true;
                }
            });
            if (index === result.length - 1) {
                if (markerFlag) {
                    res.status(constants.httpStatusCodes.conflict).send({ "message": "Marker name already taken for camera" });
                    return;
                }
                else {
                    res.status(constants.httpStatusCodes.success).send({ "message": "Valid marker" });
                    return;
                }
            }
        });
    });
}

var getAllBoundingBoxes = function (req, res) {
    cameraDao.getAllBoundingBoxes(req, res);
}

var toggleStreaming = function (req, res) {
    var toggleFlag = req.body.flag;
    var camId = req.body.camId;
    var aggregatorId = req.body.aggregatorId;
    var computeEngineId = req.body.computeEngineId;
    var userId = req.headers['userid'];
    var message = new Message(JSON.stringify(req.body));
    message.ack = 'full';
    message.messageId = "toggleSendImageFlag";

    if (toggleFlag === 1) {
        if (streamingReqMap.has(camId)) {
            var count = streamingReqMap.get(camId);
            streamingReqMap.set(camId, count + 1);
        }
        else {
            streamingReqMap.set(camId, 1);
        }
        iotHubClient.send(aggregatorId, message, iotHubErrorHandler('send'));
        iotHubClient.send(computeEngineId, message, iotHubErrorHandler('send'));
        res.status(constants.httpStatusCodes.success).send({ "message": "success" });
        return;
    }
    else if (toggleFlag === 0) {
        var count = streamingReqMap.get(camId);
        streamingReqMap.set(camId, count - 1);
        if (streamingReqMap.get(camId) === 0) {
            iotHubClient.send(aggregatorId, message, iotHubErrorHandler('send'));
            iotHubClient.send(computeEngineId, message, iotHubErrorHandler('send'));
        }
        res.status(constants.httpStatusCodes.success).send({ "message": "success" });
        return;
    }
    else {
        errorHandler('UnprocessableEntity', res);
        return;
    }
}

var updateCameraStatusAggrCompute = function (req, callback) {
    if (req.query.computeEngineIds || req.query.aggregatorIds) {
        cameraDao.updateCameraStatusAggrCompute(req, callback);
    }
    else {
        callback({ 'message': 'unprocessable entity' }, null);
    }
}

var sendRawImage = function(req, res){    
    var reqBody = req.body
    var imageName = reqBody.imgName;
    var cameraId = imageName.split('.');
    var addCameraProfileReq = {
        'cameraId': cameraId[0],
        'imageBase64': reqBody.imgBase64
    }
    io.emit('rawImage/' + reqBody.userId, {
        message: JSON.stringify(reqBody)
    });
    cameraProfileController.registerCameraProfile(addCameraProfileReq);
    res.status(constants.httpStatusCodes.success).send({'message': 'success'});
}

exports.addCamera = addCamera;
exports.getCameraById = getCameraById;
exports.setBoundingBox = setBoundingBox;
exports.validateCamera = validateCamera;
exports.retrieveCamera = retrieveCamera;
exports.startStopCamera = startStopCamera;
exports.getRawImage = getRawImage;
exports.deleteCamera = deleteCamera;
exports.getCameraDetailsByName = getCameraDetailsByName;
exports.updateCamera = updateCamera;
exports.plotCameras = plotCameras;
exports.getLiveCameraCountByFeature = getLiveCameraCountByFeature;
exports.getCamerasByAggregators = getCamerasByAggregators;
exports.validateMarker = validateMarker;
exports.getAllBoundingBoxes = getAllBoundingBoxes;
exports.toggleStreaming = toggleStreaming;
exports.updateCameraStatusAggrCompute = updateCameraStatusAggrCompute;
exports.sendRawImage = sendRawImage;