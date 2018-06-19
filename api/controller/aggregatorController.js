var cameraController = require('./cameraController');
var cameraDao = require('../dao/cameraDao');
var aggregatorDao = require('../dao/aggregatorDao');
var iotHubClient = require('../iothub/iotHubClient').iotHubClient;
var Message = require('azure-iot-common').Message;
var iotHubErrorHandler = require('../helpers/iotHubErrorHandler').sendMessageCallback;
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var server = require('../../server');
var logger = require('../logger/index').logger;
var logStr = 'AggregatorController';

var triplineCamMap = server.triplineCamMap;

/** Register aggregator which is pinged by aggregator (South bound) */
var registerAggregator = function (req, res) {
    aggregatorDao.getAggregatorByMacId(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (!result) {
            req.body.status = 0;
            aggregatorDao.registerAggregator(req, res);
        }
        else {
            if (result.status === 0) {
                req.body.status = 0;
            }
            else {
                req.body.status = 2;
            }
            aggregatorDao.registerAggregator(req, res);
        }
    });
};

/** Register aggregator which is added by user and not yet register from aggregator */
var manualAggregator = function (req, res) {
    aggregatorDao.getAggregatorByMacId(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (result) {
            res.status(constants.httpStatusCodes.success).send(result);
            return;
        }
        req.body.status = 1;
        aggregatorDao.registerAggregator(req, res);
    });
}

var updateAggregator = function (req, res) {
    aggregatorDao.getAggregatorById(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (!result) {
            errorHandler('AggregatorNotFoundError', res);
            return;
        }

        var updateReq = {};
        updateReq.body = {};
        updateReq.body.macId = result.macId;
        if (req.body.status === 1) {
            updateReq.body.status = result.status;
            if (result.status === 0) {
                updateReq.body.status = 2;
            }
        }
        else if(req.body.status === 0) {
            updateReq.body = {};
            updateReq.body.macId = result.macId;
            updateReq.body.status = result.status;
            if(result.status === 2){
            updateReq.body.status = 0;
            }
        }
        else{
            updateReq.body = req.body;
            updateReq.body.macId = result.macId;
            updateReq.body.status = result.status;
        }
        aggregatorDao.updateAggregator(updateReq, res);
    });
}

var getAllAggregators = function (req, res) {
    aggregatorDao.getAllAggregators(req, res);
}

var getAggregatorById = function (req, res) {
    aggregatorDao.getAggregatorById(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (!result) {
            errorHandler('AggregatorNotFoundError', res);
            return;
        }
        res.status(constants.httpStatusCodes.success).send(result);
    });
}

var StopCameras = function(aggregatorIdArray){
    var camReq = {};
    camReq.query = {};
    camReq.query.aggregatorIds = aggregatorIdArray;
    
    cameraDao.getCamerasByAggrCompute(camReq, function(error, result){
        if(error){
            logger.error("%s : Error in getCamerasByAggrCompute function : ", logStr, error);
            return;
        }

        result.forEach(function (cam, index) {
            var camIdArray = [];
            camIdArray.push(cam._id);
            var message = new Message(JSON.stringify(camIdArray));
            message.ack = 'full';
            message.messageId = "stopCamera";
            triplineCamMap.delete(cam._id);
            iotHubClient.send(cam.aggregator, message, iotHubErrorHandler('send'));
            iotHubClient.send(cam.computeEngine, message, iotHubErrorHandler('send'));
            updateCameraStatusAggrCompute(aggregatorIdArray);
        });
    });
}

updateCameraStatusAggrCompute = function(aggregatorIdArray){
    var updateCamReq = {};
    updateCamReq.query = {};
    updateCamReq.query.aggregatorIds = aggregatorIdArray;
    cameraController.updateCameraStatusAggrCompute(updateCamReq, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateCameraStatusAggrCompute function : ", logStr, error);
            return;
        }
        else {
            logger.debug("%s : camera updated : ", logStr);
        }
    });
}

var removeAggregator = function (req, res) {
    aggregatorDao.removeAggregator(req, function(error, result){
        if(error){
            errorHandler(error, res);
            return;
        }
        var aggregatorIdArray = [];
        aggregatorIdArray.push(req.params.id);
        StopCameras(aggregatorIdArray);
        res.status(constants.httpStatusCodes.noContent).send();
    });
}

exports.registerAggregator = registerAggregator;
exports.manualAggregator = manualAggregator;
exports.updateAggregator = updateAggregator;
exports.getAllAggregators = getAllAggregators;
exports.getAggregatorById = getAggregatorById;
exports.removeAggregator = removeAggregator;