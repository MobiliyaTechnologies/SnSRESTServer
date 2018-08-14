var azure = require('azure-storage');
var CronJob = require('cron').CronJob;
var videoRetentiionDao = require('../dao/videoRetentionDao');
var notificationController = require('../controller/notificationController');
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'RemoveExpiredVideosCron';

var blobService = azure.createBlobService(constants.videoBlobStorage.blobStorageAccountName, constants.videoBlobStorage.blobStorageAccessKey, constants.videoBlobStorage.blobUri);

var job = new CronJob('00 00 00 * * *', function () {
    logger.debug("%s : Remove expired videos cron job executed", logStr);
    getExpiredVideos();
}, function () { }, true);

var getExpiredVideos = function () {
    videoRetentiionDao.getExpiredVideos(function (error, result) {
        if (error) {
            logger.error("%s : Error in getExpiredVideos function : ", logStr, error);
            return;
        }
        var videoIdArray = [];
        var videoNameArray = [];
        var videoUrlArray = [];
        result.forEach(function (video, index) {
            videoIdArray.push(video._id);
                    videoNameArray.push(video.videoName);
                    videoUrlArray.push(video.videoUrl);
            if (index === result.length - 1) {
                removeExpiredVideos(videoIdArray, videoNameArray, videoUrlArray);
            }
        });
    });
}

var removeExpiredVideos = function (videoIdArray, videoNameArray, videoUrlArray) {
    videoRetentiionDao.removeMultipleVideo(videoIdArray, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeExpiredVideos function : ", logStr, error);
            return;
        }
        /** remove from blob as well */
        videoUrlArray.forEach(function (videoUrl, index) {
            var videoUrl = (videoUrl).split('/');
            blobService.deleteBlobIfExists(constants.videoBlobStorage.blobContainerName, videoUrl[4], function (error, result) {
                if (error) {
                    logger.error("%s : Error in removeExpiredVideos function : ", logStr, error);
                    return;
                }
                logger.debug("%s : Video deleted from blob", logStr);
            });
            if (index === videoUrlArray.length - 1) {
                var notificationReq = { 'message': 'Videos removed: ' + videoNameArray };
                notificationController.createNotification(notificationReq, 'VideoRetentionExpired');
            }
        });
    });
}