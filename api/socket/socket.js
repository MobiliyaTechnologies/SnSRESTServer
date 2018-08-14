var app = require('../../server');
var server = app.server;
var socketIo = require('socket.io')(server);
var constants = require('../config/constants');
var mobileCamMap = app.mobileCamMap;
var imageMap = app.imageMap;
var logger = require('../logger/index').logger;
var logStr = 'Socket';
var cameraDao = require('../dao/cameraDao');
exports.socketIo = socketIo;
var iotHubClient = require('../iothub/iotHubClient').iotHubClient;
var Message = require('azure-iot-common').Message;
var iotHubErrorHandler = require('../helpers/iotHubErrorHandler').sendMessageCallback;
var logger = require('../logger/index').logger;
var logStr = 'Socket';

/** Socket connection*/
socketIo.on('connection', function (socket) {
    logger.debug("%s : New connection connected", logStr);

    /** Listen on socket topic to receive images from mobile device */
    socket.on('mobileImages', function (message) {
        logger.debug("%s : Mobile Image Received", logStr);
        if (mobileCamMap.has(message.camId)) {
            var req = {};
            req.queryCondition = { _id: message.camId }
            cameraDao.getCameraDetails(req, function (error, result) {
                if (error) {
                    logger.error("%s : Error in getCameraDetails : ", logStr, error);
                    return;
                }
                if (!result) {
                    logger.error("%s : Camera not found error in getCameraDetails : ", logStr);
                    return;
                }
                
                var detectionAlgorithms = result.computeEngine.detectionAlgorithms;
                var index = detectionAlgorithms.findIndex(obj => obj.featureName == result.feature);

                message.boundingBox = result.boundingBox;
                message.imageHeight = result.imageHeight;
                message.imageWidth = result.imageWidth;
                message.frameWidth = { "width": result.frameWidth, "height": result.frameHeight };
                message.coOrdinates = result.coordinates;
                message.wayToCommunicate = result.computeEngine.wayToCommunicate;
                message.computeEngineFps = result.computeEngine.detectionAlgorithms[index].fps;

                var mobileReq = new Message(JSON.stringify(message));
                mobileReq.ack = 'full';
                mobileReq.messageId = "mobileCameraLiveImages";
                iotHubClient.send(message.aggregatorId, mobileReq, iotHubErrorHandler('send'));
                var computeEngineReq = message;
                delete computeEngineReq.base64Image;

                if (mobileCamMap.get(message.camId)) {
                    mobileCamMap.set(message.camId, false);
                    var startStreamingReq = new Message(JSON.stringify(computeEngineReq));
                    startStreamingReq.ack = 'full';
                    startStreamingReq.messageId = "startStreaming";
                    iotHubClient.send(message.computeEngineId, startStreamingReq, iotHubErrorHandler('send'));
                }
            });
        }
        else {
            var rawImageReq = new Message(JSON.stringify(message));
            rawImageReq.ack = 'full';
            rawImageReq.messageId = "mobileCameraRawImage";
            iotHubClient.send(message.aggregatorId, rawImageReq, iotHubErrorHandler('send'));
        }
    });
});