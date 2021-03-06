var notification = require('../models/notificationModel');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var logger = require('../logger/index').logger;
var logStr = 'NotificationDao';

/**
 * This function will save notification details in database
 * @param {object} req Request contains notification details
 * @param {object} res Response will return success response
 */
var createNotification = function (req,callback) {
    logger.debug("%s : In createNotification function", logStr);
    req.timestamp = Math.round(new Date().setDate(new Date().getDate()) / 1000);
    notification.create(req, function (error, result) {
        if (error) {
            logger.error("%s : Error in createNotification function : ", logStr, error);
            callback(error, null);
            return;
        }
        logger.debug("%s : Sending Success response of createNotification function.", logStr);
        callback(null, result);
    });
};

/**
 * This function will return notification details
 * @param {object} req Request
 * @param {object} res Response will return notification details
 */
var getNotification = function(req,res){
    logger.debug("%s : In getNotification function" , logStr);
    notification.find({}, function (error, result) {
        if (error) {
            logger.error("%s : Error in getNotification function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of getNotification function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    }).sort({ 'createdAt': -1 });
};

var removeReadNotifications = function(callback){
    logger.debug("%s : In removeReadNotifications function" , logStr);
    var timestampBeforeWeek = Math.round(new Date().setDate(new Date().getDate() - 7) / 1000);
    notification.remove({timestamp : {$lt: timestampBeforeWeek}}, function(error, result){
        if(error){
            logger.error("%s : Error in removeReadNotifications function : ", logStr, error);
            callback(error, null);
        }
        else{
            logger.debug("%s : Sending Success response of removeReadNotifications function.", logStr);
            callback(null, result);
        }
    });
}

exports.createNotification = createNotification;
exports.getNotification = getNotification;
exports.removeReadNotifications = removeReadNotifications;