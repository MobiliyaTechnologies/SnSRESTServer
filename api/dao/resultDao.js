var result = require('../models/resultModel');
var constants = require('../config/constants');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var logger = require('../logger/index').logger;
var logStr = 'ResultDao';

/**
 * Save result of image to database 
 * @param {object} resultData 
 */
var addResult = function (resultData) {
    logger.debug("%s : In addResult function", logStr);
    result.create(resultData, function (error, result) {
        if (error) {
            logger.error("%s : Error in addResult function : ", logStr, error);
            return;
        }
        logger.debug("%s : Sending Success response of addResult function.", logStr);
    });
};

/**
* This will return total number of detections by feature during last one month
* @param {object} req 
* @param {object} res 
*/
var getDetectionCountByFeature = function (req, res) {
    logger.debug("%s : In getDetectionCountByFeature function", logStr);
    var dateBeforeOneMonth = Math.round(new Date().setDate(new Date().getDate() - 30) / 1000);
    var currentDate = Math.round(new Date().setDate(new Date().getDate()) / 1000);
    var query = [];

    if (req.query.from) {
        dateBeforeOneMonth = parseInt(req.query.from);
    }
    if (req.query.to) {
        currentDate = parseInt(req.query.to);
    }
    var matchQuery = { '$match': { timestamp: { $gt: dateBeforeOneMonth, $lt: currentDate } } };
    if (req.query.feature && req.query.feature === 'tripline') {
        matchQuery = { '$match': { isTripline: '1', timestamp: { $gt: dateBeforeOneMonth, $lt: currentDate } } };
    }
    else if(req.query.feature){
        matchQuery = { '$match': { feature: req.query.feature, timestamp: { $gt: dateBeforeOneMonth, $lt: currentDate } } };
    }

    query.push(matchQuery);

    if(req.query.feature && req.query.feature === 'tripline'){
        query.push({ '$sort': { 'timestamp': -1 } },
        {
            '$group': {
                _id: '$camId', count: { $sum: '$resultCount' }, avg: { $avg: "$resultCount" },
                min: { $min: "$resultCount" }, max: { $max: "$resultCount" }, deviceName: { $first: '$deviceName' },
                totalCount: { $sum: "$resultCount" }
            }
        });    
    }
    else{
    query.push({ '$sort': { 'timestamp': -1 } },
        {
            '$group': {
                _id: '$camId', count: { $sum: '$resultCount' }, avg: { $avg: "$resultCount" },
                min: { $min: "$resultCount" }, max: { $max: "$resultCount" }, deviceName: { $first: '$deviceName' },
                totalCount: { $first: "$totalCount" }
            }
        });
    }

    result.aggregate(query, function (error, result) {
        if (error) {
            logger.error("%s : Error in getDetectionCountByFeature function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        logger.debug("%s : Sending Success response of getDetectionCountByFeature function.", logStr);
        res.status(constants.httpStatusCodes.success).send(result);
    });
};

/**
* This will return total number of detections by each camera during last one month
* @param {object} req 
* @param {object} res 
*/
var getDetectionCountByCameras = function (req, res) {
    logger.debug("%s : In getDetectionCountByCameras function" + JSON.stringify(req.body), logStr);
    var dateBeforeOneMonth = Math.round(new Date().setDate(new Date().getDate() - 30) / 1000);
    var currentDate = Math.round(new Date().setDate(new Date().getDate()) / 1000);
    if (req.query.from) {
        dateBeforeOneMonth = parseInt(req.query.from);
    }
    if (req.query.to) {
        currentDate = parseInt(req.query.to);
    }

    var reqBody = req.body;
    var camIdArray = [];
    reqBody.forEach(function (camera) {
        camIdArray.push(camera.camId);
    });

    result.aggregate([
        { '$match': { camId: { $in: camIdArray }, timestamp: { $gt: dateBeforeOneMonth, $lt: currentDate } } },
        { '$sort': { "timestamp": -1 } },
        { '$group': { '_id': '$camId', 'count': { $first: "$totalCount" }, 'camId': { $first: '$camId' }, 'deviceName': { $first: '$deviceName' } } },
        { '$project': { '_id': 0, 'camId': 1, 'count': 1, 'deviceName': 1 } }
    ], 
    function (error, result) {
        if (error) {
            logger.error("%s : Error in getDetectionCountByCameras function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        var responseArray = [];
        var count = 0;
        logger.debug("%s : Sending Success response of getDetectionCountByCameras function.", logStr);
        reqBody.forEach(function (cam, index) {
            var flag = false;
            if (result.length === 0) {
                responseArray.push({ 'count': 0, 'camId': cam.camId, 'deviceName': cam.deviceName });
            }
            else {
                result.forEach(function (response, index) {
                    if (response.camId === cam.camId) {
                        responseArray.push(response);
                        count += response.count;
                        flag = true;
                        return;
                    }
                    if (index === result.length - 1 && !flag) {
                        responseArray.push({ 'count': 0, 'camId': cam.camId, 'deviceName': cam.deviceName });
                    }
                });
            }
            if (index === reqBody.length - 1) {
                res.status(constants.httpStatusCodes.success).send([{ 'results': responseArray, 'totalCount': count }]);
            }
        });
    });
};

/**
* This function is to maintain local count of person detection
* @param {function} callback 
*/
var getLatestResult = function (callback) {
    logger.debug("%s : In getLatestResult function", logStr);
    result.aggregate([
        { '$sort': { 'timestamp': -1 } },
        { '$group': { _id: '$camId', previousCount: { $first: "$resultCount" }, totalCount: { $first: "$totalCount" } } }
    ], function (error, result) {
        if (error) {
            logger.error("%s : Error in getLatestResult function : ", logStr, error);
            callback(error, null);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of getLatestResult function.", logStr);
            callback(null, result);
        }
    });
}

exports.addResult = addResult;
exports.getDetectionCountByFeature = getDetectionCountByFeature;
exports.getDetectionCountByCameras = getDetectionCountByCameras;
exports.getLatestResult = getLatestResult;