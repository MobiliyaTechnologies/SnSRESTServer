var cameraController = require('./cameraController');
var cameraDao = require('../dao/cameraDao');
var computeEngineDao = require('../dao/computeEngineDao');
var iotHubClient = require('../iothub/iotHubClient').iotHubClient;
var Message = require('azure-iot-common').Message;
var iotHubErrorHandler = require('../helpers/iotHubErrorHandler').sendMessageCallback;
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var server = require('../../server');
var logger = require('../logger/index').logger;
var logStr = 'ComputeEngineController';

var triplineCamMap = server.triplineCamMap;
/** Register compute engine which is pinged by compute engine (South bound) */
var registerComputeEngine = function (req, res) {
    computeEngineDao.getComputeEngineByMacId(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (!result) {
            req.body.status = 0;
            computeEngineDao.registerComputeEngine(req, res);
        }
        else {
            if (result.status === 0) {
                req.body.status = 0;
            }
            else {
                req.body.status = 2;
            }
            computeEngineDao.registerComputeEngine(req, res);
        }
    });
};

/** Register aggregator which is added by user and not yet register from aggregator */
var manualComputeEngine = function (req, res) {
    computeEngineDao.getComputeEngineByMacId(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (result) {
            res.status(constants.httpStatusCodes.success).send(result);
            return;
        }
        req.body.status = 1;
        computeEngineDao.registerComputeEngine(req, res);
    });
}

var registerAlgorithm = function (req, res) {
    var updateReq = {};
    updateReq.queryCondition = { '_id': req.body.computeEngineId };
    updateReq.updateData = { $set: { 'detectionAlgorithms': req.body.detectionAlgorithms } };
    computeEngineDao.updateComputeEngine(updateReq, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        res.status(constants.httpStatusCodes.resourceCreated).send({'message': 'Algorithm registered successfully'});
    });
}

var unregisterAlgorithm = function unregisterAlgorithm(req, res) {
    computeEngineDao.unregisterAlgorithm(req, res);
}

var updateComputeEngine = function (req, res) {
    computeEngineDao.getComputeEngineById(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (!result) {
            errorHandler('ComputeEngineNotFoundError', res);
            return;
        }
        /**Send pricing tier to compute engine */
        var messageReq = {'tier': req.body.tier};
        var message = new Message(JSON.stringify(messageReq));
        message.ack = 'full';
        message.messageId = "toggleTier";
        iotHubClient.send(req.params.id, message, iotHubErrorHandler('send'));

        var updateReq = {};
        updateReq.queryCondition = { '_id': result._id };
        updateReq.updateData = {};
        if (req.body.status === 1) {
            var updateData = {};
            updateData.status = result.status;
            if (result.status === 0) {
                updateData.status = 2;
            }
            updateReq.updateData = updateData;
        }
        else if(req.body.status === 0){
            var updateData = {};
            updateData.status = result.status;
            if (result.status === 2) {
                updateData.status = 0;
            }
            updateReq.updateData = updateData;
        }
        else{
            server.facePricingTier = req.body.tier;
            var updateData = {};
            updateData = req.body;
            updateData.status = result.status;
            updateReq.updateData = updateData;
        }
        computeEngineDao.updateComputeEngine(updateReq, function (error, result) {
            updateComputeEngineErrorHandler(error, result, res);
        });
    });
}

var updateComputeEngineErrorHandler = function (error, result, res) {
    if (error) {
        errorHandler(error, res);
        return;
    }
    res.status(constants.httpStatusCodes.success).send({'message': 'Compute engine details updated'});
}

var getAllComputeEngines = function (req, res) {
    computeEngineDao.getAllComputeEngines(req, res);
}

var getComputeEngineById = function (req, res) {
    computeEngineDao.getComputeEngineById(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (!result) {
            errorHandler('ComputeEngineNotFoundError', res);
            return;
        }
        res.status(constants.httpStatusCodes.success).send(result);
    });
}

var updateAlgoStatus = function (req, res) {
    computeEngineDao.updateAlgoStatus(req, res);
}

var StopCameras = function(computeEngineIdArray){
    var camReq = {};
    camReq.query = {};
    camReq.query.computeEngineIds = computeEngineIdArray;
    
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
            updateCameraStatusAggrCompute(computeEngineIdArray);
        });
    });
}

updateCameraStatusAggrCompute = function(computeEngineIdArray){
    var updateCamReq = {};
    updateCamReq.query = {};
    updateCamReq.query.computeEngineIds = computeEngineIdArray;
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

var removeComputeEngine = function removeComputeEngine(req, res) {
    computeEngineDao.removeComputeEngine(req, function(error, result){
        if(error){
            errorHandler(error, res);
            return;
        }
        var updateCamReq = {};
        updateCamReq.query = {};
        var computeEngineIdArray = [];
        computeEngineIdArray.push(req.params.id);
        StopCameras(computeEngineIdArray);
        res.status(constants.httpStatusCodes.noContent).send();
    });
}

var getFeatureList = function(req ,res){
    computeEngineDao.getFeatureList(req, res);
}

exports.registerComputeEngine = registerComputeEngine;
exports.manualComputeEngine = manualComputeEngine;
exports.registerAlgorithm = registerAlgorithm;
exports.unregisterAlgorithm = unregisterAlgorithm;
exports.updateComputeEngine = updateComputeEngine;
exports.getAllComputeEngines = getAllComputeEngines;
exports.getComputeEngineById = getComputeEngineById;
exports.updateAlgoStatus = updateAlgoStatus;
exports.removeComputeEngine = removeComputeEngine;
exports.getFeatureList = getFeatureList;