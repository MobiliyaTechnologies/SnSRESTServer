var videoIndexingDao = require('../dao/videoIndexingDao');
var notificationController = require('./notificationController');
var io = require('../socket/socket').socketIo;
var iotHubClient = require('../iothub/iotHubClient').iotHubClient;
var Message = require('azure-iot-common').Message;
var iotHubErrorHandler = require('../helpers/iotHubErrorHandler').sendMessageCallback;
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var config = require('../../settings');
var request = require('request');

var saveVideoIndex = function (req, res) {
    var currentTime = Math.round(new Date().getTime() / 1000);
    var filename = req.body.camId + '_' + currentTime;
    req.body.callbackUrl = config.hostname + '/devices/videos?filename=' + filename ;

    req.body.status = 0;
    req.body.filename = filename;
    var aggregatorId = req.body.aggregatorId;

    req.query.videoName = req.body.videoName;
    videoIndexingDao.getVideoIndexByName(req, function(error, result){
        if(error){
            errorHandler(error, res);
            return;
        }
        if(result){
            errorHandler('DuplicateDataError', res);
            return;
        }
        videoIndexingDao.saveVideoIndex(req, function (error, result) {
            if (error) {
                errorHandler(error, res);
                return;
            }
            var message = new Message(JSON.stringify(req.body));
            message.ack = 'full';
            message.messageId = "videoIndexing";
            iotHubClient.send(aggregatorId, message, iotHubErrorHandler('send'));
            res.status(constants.httpStatusCodes.success).send(result);
        });
    });
};

var updateVideoIndex = function (req, res) {
    req.body.status = 1;
    req.params.id = req.query.filename;
    req.body.indexId = req.query.id;
    videoIndexingDao.updateVideoIndex(req, function (error, res) {
        if (error) {
            var notificationReq = { 'message': 'Error indexing video' };
            notificationController.createNotification(notificationReq, 'videoIndexing');
        }
        else {
            var notificationReq = { 'message': 'Video indexing done' };
            notificationController.createNotification(notificationReq, 'videoIndexing');
        }
    });
    res.status(constants.httpStatusCodes.success).send({'message': 'success'});
}

var getVideoIndex = function (req, res) {
    videoIndexingDao.getVideoIndex(req, res);
}

var requestTogetWidgetUrl = function(url,reqType){
    return new Promise((resolve, reject)=>{
        var options = {
            rejectUnauthorized: false,
            url: url,
            method: 'GET',
            headers: {
                "Ocp-Apim-Subscription-Key": constants.videoIndexer.ocpSubscriptionKey
            }
        }
        request(options, function (error, body, response) {
            if (error) {
                reject(error);
            }
            else {
                resolve({"widget":reqType, result: JSON.parse(response)});
            }
        });
    });
}

var getVideoWidgetUrls = function (req, res) {
    var breakdownId = req.query.indexId;
    var promiseArray = [];
    promiseArray.push(requestTogetWidgetUrl(constants.videoIndexer.mediaWidgetUrl.replace("$id",breakdownId),"media"));
    promiseArray.push(requestTogetWidgetUrl(constants.videoIndexer.insightsWidgetUrl.replace("$id",breakdownId),"insights"));
    Promise.all(promiseArray).then(function(result) {
        res.status(constants.httpStatusCodes.success).send(result);
    });
}

var removeVideoById = function removeVideoById(req, res) {
    if(!req.query.videoId){
        errorHandler('UnprocessableEntity', res);
        return;
    }
    videoIndexingDao.removeVideoById(req, res);
}

exports.saveVideoIndex = saveVideoIndex;
exports.updateVideoIndex = updateVideoIndex;
exports.getVideoIndex = getVideoIndex;
exports.getVideoWidgetUrls = getVideoWidgetUrls;
exports.removeVideoById = removeVideoById;