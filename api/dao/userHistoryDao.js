var userHistory = require('../models/userHistoryModel');
var constants = require('../config/constants');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var logger = require('../logger/index').logger;
var logStr = 'UserHistoryDao';

/** This function saves user history data */
var saveUserHistory = function(userHistoryData){
    userHistory.create(userHistoryData, function (error, result) {
        if (error) {
            logger.error("%s : Error in saveUserHistory function : ", logStr, error);
            return;
        }
        logger.debug("%s : Sending Success response of saveUserHistory function.", logStr);
    });
}

/**
* This function will return user history data
* @param {object} req Request will contain user persisted face id
* @param {object} res 
*/
var getUserHistory = function (req, res) {
    logger.debug("%s : In getUserHistory function. Received userName: " + req.query.persistedFaceId, logStr);

    var page = 0;
    var limit = 100;
    var queryCondition = {'persistedFaceId': req.query.persistedFaceId};
    
    if (req.query.page && req.query.limit) {
        page = parseInt(req.query.page);
        limit = parseInt(req.query.limit);
        page = page * limit;
    }

    userHistory.find(queryCondition, {}, {
        sort: {
            'timestamp': -1
        },
        limit: limit,
        skip: page
    }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getUserHistory function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of getUserHistory function.", logStr);
            res.status(constants.httpStatusCodes.success).send(result);
        }
    });
}

/**This function will return total count of user history */
var getCountOfUserHistory = function (req, res) {
    logger.debug("%s : In getCountOfUserHistory function. Received userName: " + req.query.persistedFaceId, logStr);
    userHistory.count({ persistedFaceId: req.query.persistedFaceId }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getCountOfUserHistory function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of getCountOfUserHistory function.", logStr);
        res.status(constants.httpStatusCodes.success).send({'persistedFaceId': req.query.persistedFaceId,'count': result});
    });
}

exports.saveUserHistory = saveUserHistory;
exports.getUserHistory = getUserHistory;
exports.getCountOfUserHistory = getCountOfUserHistory;