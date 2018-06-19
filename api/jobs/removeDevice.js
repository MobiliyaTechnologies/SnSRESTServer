var constants = require('../config/constants');
var aggregatorDao = require('../dao/aggregatorDao');
var computeEngineDao = require('../dao/computeEngineDao');
var notificationController = require('../controller/notificationController');
var cameraController = require('../controller/cameraController');
var cameraDao = require('../dao/cameraDao');
var iotHubClient = require('../iothub/iotHubClient').iotHubClient;
var Message = require('azure-iot-common').Message;
var iotHubErrorHandler = require('../helpers/iotHubErrorHandler').sendMessageCallback;
var server = require('../../server');
var logger = require('../logger/index').logger;
var logStr = 'RemoveDeviceCron';

var triplineCamMap = server.triplineCamMap;

var getCameras = function(idArray, nameArray, flag){
    var camReq = {};
    camReq.query = {};
    if (flag) {
        camReq.query.aggregatorIds = idArray;
    }
    else {
        camReq.query.computeEngineIds = idArray;
    }
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
            updateCameraStatusAggrCompute(idArray, nameArray, flag);
        });
    });
}

var updateCameraStatusAggrCompute = function (idArray, nameArray, flag) {
    /** Update camera status , aggregator and compute engine */
    var updateCamReq = {};
    updateCamReq.query = {};
    if (flag) {
        updateCamReq.query.aggregatorIds = idArray;
    }
    else {
        updateCamReq.query.computeEngineIds = idArray;
    }
    cameraController.updateCameraStatusAggrCompute(updateCamReq, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateCameraStatusAggrCompute function : ", logStr, error);
            return;
        }
        else {
            var notificationReq = { 'message': 'Devices down : ' + nameArray  };
            notificationController.createNotification(notificationReq, 'DeviceDown');
        }
    });
}

var removeAggregator = function (aggregatorIdArray, aggregatorNameArray) {
    aggregatorDao.removeAggregatorByDate(aggregatorIdArray, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeAggregatorByDate function : ", logStr, error);
            return;
        }
        var isAggregator = true;
        getCameras(aggregatorIdArray, aggregatorNameArray, isAggregator);
    });
}

var removeComputeEngine = function (computeEngineIdArray, computeEngineNameArray) {
    computeEngineDao.removeComputeEngineByDate(computeEngineIdArray, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeComputeEngineByDate function : ", logStr, error);
            return;
        }
        var isAggregator = false;
        getCameras(computeEngineIdArray, computeEngineNameArray, isAggregator);
    });
}


setInterval(function () {
    aggregatorDao.getAggregatorByDate(function (error, result) {
        if (error) {
            logger.error("%s : Error in getAggregatorByDate function : ", logStr, error);
            return;
        }
        aggregatorIdArray = [];
        aggregatorNameArray = [];
        result.forEach(function (aggregator, index) {
            aggregatorIdArray.push(aggregator._id);
            aggregatorNameArray.push(aggregator.name);
            if (index === result.length - 1) {
                removeAggregator(aggregatorIdArray, aggregatorNameArray);
            }
        });
    });

    computeEngineDao.getComputeEngineByDate(function (error, result) {
        if (error) {
            logger.error("%s : Error in getComputeEngineByDate function : ", logStr, error);
            return;
        }
        computeEngineIdArray = [];
        computeEngineNameArray = [];
        result.forEach(function (computeEngine, index) {
            computeEngineIdArray.push(computeEngine._id);
            computeEngineNameArray.push(computeEngine.name);
            if (index === result.length - 1) {
                removeComputeEngine(computeEngineIdArray, computeEngineNameArray);
            }
        });
    });
}, constants.cronJobInterval);