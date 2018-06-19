var mongoose = require('mongoose');
var faces = require('../models/faceRecognitionModel');
var constants = require('../config/constants');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var logger = require('../logger/index').logger;
var logStr = 'FaceRecognitionDao';

/**
 * This function will add face details
 * @param {object} faceReq 
 * @param {function} callback 
 */
var addFaceList = function (faceReq, callback) {
    logger.debug("%s : In addFaceList function. Received request: " + JSON.stringify(faceReq.deviceName), logStr);
    faceReq.timestamp = Math.round(((new Date).getTime()) / 1000);
    var currentDate = new Date();
    var locale = "en-us";
    var day = currentDate.toLocaleString(locale, { weekday: "long" });
    var month = currentDate.toLocaleString(locale, { month: "long" });
    var year = currentDate.getFullYear();
    var date = currentDate.getDate();
    faceReq.createdDate = day + ", " + date + " " + month + " " + year;
    faces.create(faceReq, function (error, result) {
        if (error) {
            logger.error("%s : Error in add faces function : ", logStr, error);
            callback(error, null);
            return;
        }
        callback(null, result);
        logger.debug("%s : Sending Success response of FaceRecognition add faces function.", logStr);
    });
}

/**
 * This function will update user details
 * @param {object} req 
 * @param {function} callback 
 */
var updateFaceList = function (req, callback) {
    logger.debug("%s : In updateFaceList function. Received request: " + JSON.stringify(req.body), logStr);
    req.body.timestamp = Math.round(((new Date).getTime()) / 1000);
    faces.findByIdAndUpdate({ '_id': req.params.id }, req.body, { new: true }, function (error, result) {
        if (error) {
            logger.error("%s : Error in updateFaceList function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of updateFaceList function.", logStr);
            callback(null, result);
        }
    });
}

/** This function will return Face list */
var getFaceList = function (req, callback) {
    logger.debug("%s : In getFaceList function", logStr);
    var page = 0;
    var limit = 10;
    var queryCondition = {};
    if (req.query.status) {
        queryCondition.status =  parseInt(req.query.status);
    }

    if (req.query.page && req.query.limit) {
        page = parseInt(req.query.page);
        limit = parseInt(req.query.limit);
        page = page * limit;
    }

    faces.find(queryCondition, {}, {
        sort: {
            'createdAt': -1
        },
        limit: limit,
        skip: page
    }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getFaceList function : ", logStr, error);
            callback(error, null);
        }
        else if (!result) {
            logger.error("%s : Face not found error in getFaceList function : ", logStr);
                callback(null, []);
        }
        else{
            logger.debug("%s : Sending Success response of getFaceList function.", logStr);
            callback(null, result);
        }
    });
}

var getCountOfFaces = function(status, callback){
    faces.count({ status : status}, function (error, result) {
        if (error) {
            callback(error, null);
        }
        else{
        callback(null, result);
        }
    });
}

/** Get total count of faces */
var getTotalCountOffaces = function (req, res) {
    logger.debug("%s : In getTotalCountOffaces function", logStr);
    getCountOfFaces(0, function(error, resultUnknown){
        if (error) {
            logger.error("%s : Error in getTotalCountOffaces function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        getCountOfFaces(1, function(error, resultKnown){
            if (error) {
                logger.error("%s : Error in getTotalCountOffaces function : ", logStr, error);
                errorHandler(error, res);
                return;
            }
            logger.debug("%s : Sending Success response of getTotalCountOffaces function.", logStr);
            res.status(constants.httpStatusCodes.success).send([{status:0, count:resultUnknown},{status:1,count:resultKnown}]);
        });
    });
}

/** This function will remove user face details */
var removeFaces = function (req, res) {
    logger.debug("%s : In removeFaces function", logStr);
    var faceIds = req.query.faceIds;
    var faceIdsArray = faceIds.split(',');
    faces.remove({ _id: { $in: faceIdsArray.map(function (o) { return mongoose.Types.ObjectId(o); }) } }, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeFaces function : ", logStr, error);
            errorHandler(error, res);
        }
        else {
            logger.debug("%s : Sending Success response of removeFaces function.", logStr);
            res.status(constants.httpStatusCodes.noContent).send();
        }
    });
};

/** This function will return face details by id */
var getFaceListById = function (req, callback) {
    logger.debug("%s : In getFaceListById function", logStr);
    faces.findOne({ _id: req.params.id }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getFaceListById function : ", logStr, error);
            callback(error, null);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of getFaceListById function.", logStr);
            callback(null, result);
        }
    });
}

/**Remove all faces by status, by default status is zero */
var removeAllFaces = function(req,res){
    logger.debug("%s : In removeAllFaces function", logStr);
    var status = 0;
    if(req.query.status){
        status = parseInt(req.query.status);
    }
    faces.remove({ "status": status }, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeAll function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        else {
            logger.debug("%s : Sending Success response of removeAll function.", logStr);
            res.status(constants.httpStatusCodes.success).send({"result":"success"});
        }
    });
}

/** Get face list by multiple ids */
var getFaceListByArray = function(faceIds, callback){
    logger.debug("%s : In getFaceListByArray function", logStr);
    var faceIdsArray = faceIds.split(',');
    faces.find({ _id: { $in: faceIdsArray.map(function (o) { return mongoose.Types.ObjectId(o); }) } }, function (error, result) {
        if (error) {
            logger.error("%s : Error in removeAll function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of removeAll function.", logStr, result);
            callback(null, result);
        }
    });
}

/** Get face list by status*/
var getFaceListByStatus = function(status, callback){
    logger.debug("%s : In getUnidentifiedFaces function", logStr);
    faces.find({ 'status': status }, function (error, result) {
        if (error) {
            logger.error("%s : Error in getUnidentifiedFaces function : ", logStr, error);
            callback(error, null);
        }
        else {
            logger.debug("%s : Sending Success response of getUnidentifiedFaces function.", logStr);
            callback(null, result);
        }
    });
}

exports.addFaceList = addFaceList;
exports.updateFaceList = updateFaceList;
exports.getFaceList = getFaceList;
exports.removeFaces = removeFaces;
exports.getFaceListById = getFaceListById;
exports.getTotalCountOffaces = getTotalCountOffaces;
exports.removeAllFaces = removeAllFaces;
exports.getFaceListByArray = getFaceListByArray;
exports.getFaceListByStatus = getFaceListByStatus;