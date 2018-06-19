var azure = require('azure-storage');
var iotHubClient = require('../iothub/iotHubClient').iotHubClient;
var Message = require('azure-iot-common').Message;
var iotHubErrorHandler = require('../helpers/iotHubErrorHandler').sendMessageCallback;
var constants = require('../config/constants');
var videoRetentionDao = require('../dao/videoRetentionDao');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var notificationController = require('./notificationController');
var logger = require('../logger/index').logger;
var logStr = 'VideoRetentionController';

var blobService = azure.createBlobService(constants.videoBlobStorage.blobStorageAccountName, constants.videoBlobStorage.blobStorageAccessKey, constants.videoBlobStorage.blobUri);

var saveVideoRetention = function(req, res){
    var retentionTimestamp = Math.round(new Date().setDate(new Date().getDate() + req.body.retentionPeriod) / 1000);
    req.body.retentionTimestamp = retentionTimestamp;
    videoRetentionDao.saveVideoRetention(req, res);
}

var getVideoRetentionDetails = function (req, res) {
    videoRetentionDao.getVideoRetentionDetails(req, res);
}

var deleteVideoRetentionDetails = function (req, res) {
    videoRetentionDao.getVideoRetentionByVideoId(req.params.id, function (error, videoResult) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if(!videoResult){
            errorHandler('VideoRetentionNotFoundError', res);
            return;
        }
        var videoUrl = (videoResult.videoUrl).split('/');
        videoRetentionDao.deleteVideoRetentionDetails(req.params.id, function(error, result){
            if(error){
                errorHandler(error, res);
                return;
            }
            res.status(constants.httpStatusCodes.noContent).send();
            /**delete from blob */
            blobService.deleteBlobIfExists(constants.videoBlobStorage.blobContainerName, videoUrl[4], function (error, result) {
                if (error) {
                    logger.error("%s : Error while deleting video retention details from blob", logStr);
                    return;
                }
                logger.debug("%s : Video retention details deleted from blob", logStr);
                return;
            });
        });
    });
}

var getRetentionCameras = function(req, res){
    videoRetentionDao.getRetentionCameras(req, res);
}

exports.saveVideoRetention = saveVideoRetention;
exports.getRetentionCameras = getRetentionCameras;
exports.getVideoRetentionDetails = getVideoRetentionDetails;
exports.deleteVideoRetentionDetails = deleteVideoRetentionDetails;