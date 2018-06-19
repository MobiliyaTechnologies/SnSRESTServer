var fs = require('fs');
var azure = require('azure-storage');
var Readable = require('stream').Readable;
var app = require('../../server');
var request = require('request');
var resultDao = require('../dao/resultDao');
var cameraDao = require('../dao/cameraDao');
var faceRecognitionDao = require('../dao/faceRecognitionDao');
var userHistoryDao = require('../dao/userHistoryDao');
var notificationController = require('./notificationController');
var constants = require('../config/constants');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var io = require('../socket/socket').socketIo;
var logger = require('../logger/index').logger;
var logStr = 'ResultController';

var imageMap = app.imageMap;
var resultMap = app.resultMap;
var streamingReqMap = app.streamingReqMap;
var liveCameraResultMap = app.liveCameraResultMap;
var totalResultMap = app.totalResultMap;
var triplineCamMap = app.triplineCamMap;
var userIdentifiedMap = app.userIdentifiedMap;

var blobService = azure.createBlobService(constants.blobStorage.blobStorageAccountName, constants.blobStorage.blobStorageAccessKey, constants.blobStorage.blobUri);

/** This function will send live dashbord data to webapp */
var sendLiveCameraDashboardResult = function (camId, deviceName, totalresult, currentTime, bboxResults) {
    if (liveCameraResultMap.has(camId)) {
        var liveDashboardReq = liveCameraResultMap.get(camId);
        var userId = liveDashboardReq.userId;
        var filter = liveDashboardReq.filter;
        if (filter === 'camera') {
            var liveDashbordResult = {
                'camId': camId,
                'deviceName': deviceName,
                'count': totalresult,
                'timestamp': currentTime,
                'bboxResults': bboxResults
            }
            io.emit('liveDashboard/' + userId, {
                message: liveDashbordResult
            });
        }
        else {
            if (bboxResults) {
                liveDashboardReq.forEach(function (marker, index) {
                    bboxResults.forEach(function (bbox, index) {
                        if (bbox.markerName === marker.markerName) {
                            var liveDashbordResult = {
                                'camId': camId,
                                'deviceName': deviceName,
                                'count': totalresult,
                                'timestamp': currentTime,
                                'bboxResults': bbox
                            }
                            io.emit('liveDashboard/' + marker.userId, {
                                message: liveDashbordResult
                            });
                        }
                    });
                });
            }
        }
    }
}

var uploadUserImage = function (base64, callback) {
    var filename = 'faceRecogniton_' + (new Date).getTime() + '.jpg';
    var base64Data = base64.replace(/^data:image\/jpg;base64,/,"")
    var binaryData = new Buffer(base64Data, 'base64').toString('binary');
    var imageFullPath = './faceRecognitionImages/' + filename;
    var imageUrl = constants.blobStorage.blobUri + constants.blobStorage.blobContainerName + '/' + filename;
    fs.writeFile(imageFullPath, binaryData, "binary", function(error) {
       if(error){
        logger.error("%s : Error while creating Image", logStr, error);
        callback(error, null);
       }
       else{
        blobService.createBlockBlobFromLocalFile(constants.blobStorage.blobContainerName, filename,imageFullPath,
            function (error, result, response) {
                if (error) {
                    logger.error("%s : Error while uploading Image", logStr, error);
                    callback(error, null);
                }
                else {
                    logger.debug("%s : Image uploaded successfully", logStr);
                    callback(null, { 'filename': imageUrl });
                }
                /** Delete uploaded file */
                fs.unlink(imageFullPath, function (error) {
                    if (error) {
                        logger.error("%s : Error while deleting files", logStr, error);
                    }
                    logger.debug("%s : File deleted", logStr);
                });
            }
        );
       }
    });
}

/** This function will save unknown user data from face recognition */
var addUnknownUserData = function (bbox, imagBase64, userId, camId) {
    logger.debug("%s: In addUnknownUserData function", logStr);
    if (bbox) {
        bbox.forEach(function (result, index) {
            if (result.userData === 'Unknown') {
                logger.debug("%S: Unknown face found", logStr);
                uploadUserImage(imagBase64, function (error, blobResult) {
                    if (error) {
                        logger.error("%s : Error while uploading Image", logStr, error);
                        return;
                    }
                    var faceData = {
                        'age': result.age,
                        'gender': result.gender,
                        'faceRectangle': result.faceRectangle,
                        'deviceName': result.deviceName,
                        'faceId': result.faceId,
                        'imgUrl': blobResult.filename
                    };
                    faceRecognitionDao.addFaceList(faceData, function (error, result) {
                        if (error) {
                            logger.error("%s: Error in addFaceList function", logStr, error);
                            return;
                        }
                        logger.debug("%s: Face data saved", logStr);
                        //Send face recognition data
                        result.imgUrl = blobResult.filename;
                        io.emit('faceRecognition/' + userId, JSON.stringify(result));
                    });
                });
            }
            else {
                if (result.flag) {
                    var currentTime = Math.round(((new Date).getTime()) / 1000);
                    var sendNotificationAt = Math.round(new Date().setHours(new Date().getHours() + constants.userNotificationTimeHr) / 1000);
                    var userNotification = {
                        'userData': result.userData,
                        'timestamp': currentTime
                    }
                    var userDataArray = userIdentifiedMap.get(camId);
                    if (userDataArray) {
                        var isFound = false;
                        userDataArray.forEach(function (user, index) {
                            if (user.userData == result.userData && user.timestamp <= currentTime) {
                                isFound = true;
                                //send notification
                                userDataArray.splice(index, 1);
                                userDataArray.push({ 'userData': result.userData, 'timestamp': sendNotificationAt });
                                userIdentifiedMap.set(camId, userDataArray);
                                var notificationReq = { 'message': 'Identified User : ' + result.userData };
                                notificationController.createNotification(notificationReq, 'faceIdentified');
                                return;
                            }
                            else if (user.userData == result.userData && user.timestamp > currentTime) {
                                isFound = true;
                                return;
                            }
                            else {
                                isFound = false;
                            }
                            if (index === userDataArray.length - 1) {
                                if (!isFound) {
                                    //send notification
                                    userDataArray.push({ 'userData': result.userData, 'timestamp': sendNotificationAt });
                                    userIdentifiedMap.set(camId, userDataArray);
                                    var notificationReq = { 'message': 'Identified User : ' + result.userData };
                                    notificationController.createNotification(notificationReq, 'faceIdentified');
                                    return;
                                }
                            }
                        });
                    }
                    else {
                        userDataArray = [];
                        userDataArray.push({ 'userData': result.userData, 'timestamp': sendNotificationAt });
                        userIdentifiedMap.set(camId, userDataArray);
                        var notificationReq = { 'message': 'Identified User : ' + result.userData };
                        notificationController.createNotification(notificationReq, 'faceIdentified');
                        return;
                    }
                }
            }
        });
    }
}

/** This function will maintain total count per camera */
var saveTotalCount = function (resultData) {
    logger.debug("%s: In saveTotalCount function", logStr);
    var currentResult = resultData.resultCount;
    var previousCount = 0;
    var totalCount = 0;
    if (totalResultMap.has(resultData.camId)) {
        var counts = totalResultMap.get(resultData.camId);
        previousCount = counts.previousCount;
        totalCount = counts.totalCount;
    }
    if (currentResult > previousCount) {
        totalCount = totalCount + (currentResult - previousCount);
    }
    var counts = { 'previousCount': currentResult, 'totalCount': totalCount };
    totalResultMap.set(resultData.camId, counts);
    resultData.totalCount = totalCount;
    /** Save result to database */
    resultDao.addResult(resultData);
    return;
}

/** Get result of image */
var getResult = function (req, res) {
    logger.debug("%s : In getResult function. Received request : " + req.body.imageName, logStr);
    res.status(constants.httpStatusCodes.success).send({ 'message': 'success' });

    var totalresult = req.body.totalCount;
    var imageName = req.body.imageName;
    var bbox = req.body.boundingBoxes;
    var imageField = [];

    if (imageName) {
        imageField = imageName.split('_');
    }
    var currentTime = Math.round(((new Date).getTime()) / 1000);
    var camId = imageField[0];

    var analytics = {
        'countPerBox': req.body.countPerBbox,
        'totalResult': totalresult,
        'bbox': bbox,
        'imageName': imageName,
        'camId': camId,
        'deviceName': req.body.deviceName,
        'feature': req.body.feature,
        'bboxResults': req.body.bboxResults,
        'userId': req.body.userId
    };

    if (bbox && bbox.length > 0) {
        bbox.forEach(function (faceBbox, index) {
            if (faceBbox.persistedFaceId) {
                var imageWidth = req.body.imageWidth;
                var imageHeight = req.body.imageHeight;
                var top = faceBbox.faceRectangle.top;
                var left = faceBbox.faceRectangle.left;
                var width = faceBbox.faceRectangle.width;
                var height = faceBbox.faceRectangle.height;
                
                var userHistoryReq = {
                    'camId': camId,
                    'deviceName': req.body.deviceName,
                    'persistedFaceId': faceBbox.persistedFaceId,
                    'timestamp': currentTime,
                    'relativeY': ((top + (height / 2)) * 100) / imageHeight,
                    'relativeX': ((left + (width / 2)) * 100) / imageWidth,
                    'userData': faceBbox.userData,
                    'age': faceBbox.age,
                    'gender': faceBbox.gender
                }

                userHistoryDao.saveUserHistory(userHistoryReq);
            }
        });
    }

    /** Save result to database */
    var resultData = {
        'imageName': imageName,
        'result': bbox,
        'timestamp': currentTime,
        'resultCount': totalresult,
        'camId': camId,
        'deviceName': req.body.deviceName,
        'feature': req.body.feature,
        'isTripline': req.body.isTripline,
        'bboxResults': req.body.bboxResults
    };

    /**Send Live Data */
    io.emit('liveResults', {
        message: resultData
    });

    /** Send live camera dashbord result */
    sendLiveCameraDashboardResult(camId, req.body.deviceName, totalresult, currentTime, req.body.bboxResults);

    /**save count to database */
    saveTotalCount(resultData);

    /** If tripline crossed send notification */
    if (req.body.isTripline) {
        var triplineTimestamp = req.body.timestamp;
        if (!triplineCamMap.has(camId)) {
            return;
        }

        var triplineCamData = triplineCamMap.get(camId);
        if (triplineCamData === 0) {
            triplineCamMap.set(camId, { 'timestamp': triplineTimestamp, 'bboxResults': req.body.bboxResults, 'totalResult': totalresult });
            analytics.imgBase64 = req.body.imgBase64;
            io.emit('liveImage', {
                message: analytics
            });

            if (totalresult > 0) {
                var notificationReq = { 'message': 'Tripline Crossed' };
                notificationController.createNotification(notificationReq, 'Tripline');
            }
            return;
        }
        else {
            var newBboxResults = [];
            var previousTriplineData = triplineCamData.bboxResults;
            var currentTriplineData = req.body.bboxResults;
            var totalTriplineResultCount = triplineCamData.totalResult;
            previousTriplineData.forEach(function (previousResult, index) {
                currentTriplineData.forEach(function (currentResult) {
                    if (previousResult.markerName === currentResult.markerName) {
                        var newResult = {};
                        newResult.markerName = previousResult.markerName;
                        newResult.tagName = previousResult.tagName;
                        newResult.objectType = previousResult.objectType;
                        newResult.count = parseInt(previousResult.count) + parseInt(currentResult.count);
                        newBboxResults.push(newResult);
                        totalTriplineResultCount = parseInt(totalTriplineResultCount) + parseInt(currentResult.count);
                    }
                });
                if (index === previousTriplineData.length - 1) {
                    if (triplineCamMap.get(camId).timestamp > triplineTimestamp) {
                        triplineCamMap.set(camId, { 'timestamp': triplineCamMap.get(camId).timestamp, 'bboxResults': newBboxResults, 'totalResult': totalTriplineResultCount });
                        return;
                    }
                    analytics.imgBase64 = req.body.imgBase64;
                    analytics.bboxResults = newBboxResults;
                    analytics.totalResult = totalTriplineResultCount;
                    io.emit('liveImage', {
                        message: analytics
                    });
                    if (triplineCamData.totalResult < totalresult) {
                        var notificationReq = { 'message': 'Tripline Crossed' };
                        notificationController.createNotification(notificationReq, 'Tripline');
                    }
                    triplineCamMap.set(camId, { 'timestamp': triplineTimestamp, 'bboxResults': newBboxResults, 'totalResult': totalTriplineResultCount });
                    return;
                }
            });
        }
    }

    if (imageMap.has(imageName)) {
        /** If faceRecognition data then add to facedetails */
        if (req.body.feature === 'faceRecognition') {
            addUnknownUserData(bbox, imageMap.get(imageName), req.body.userId, camId);
        }

        analytics.imgBase64 = imageMap.get(imageName);
        io.emit('liveImage', {
            message: analytics
        });

        var currentFileNameArray = imageName.split('_').join(',').split('.').join(',').split(',');
        var currentImageTimestamp = currentFileNameArray[2];
        for (var key of imageMap.keys()) {
            var filenameKeys = key.split('_').join(',').split('.').join(',').split(',');
            var mapFileTimestamp = filenameKeys[2];
            if (key.startsWith(camId) && mapFileTimestamp < currentImageTimestamp && key !== imageName) {
                imageMap.delete(key);
            }
        }

        /**Remove image from imageMap*/
        imageMap.delete(req.body.imageName);
    }
    else {
        resultMap.set(req.body.imageName, analytics);
    }
};

/** Get image */
var getImage = function (req, res) {
    logger.debug("%s : In getImage function. Received request: " + req.body.imgName, logStr);
    var imageName = req.body.imgName;
    var currentTime = Math.round(((new Date).getTime()) / 1000);
    var imageField = [];
    if (imageName) {
        imageField = imageName.split('_');
    }
    var camId = imageField[0];

    if (resultMap.has(imageName)) {
        var analytics = resultMap.get(imageName);
        /** If faceRecognition data then add to facedetails */
        if (analytics.feature === 'faceRecognition') {
            addUnknownUserData(analytics.bbox, req.body.imgBase64, analytics.userId, camId);
        }

        analytics.imgBase64 = req.body.imgBase64;
        io.emit('liveImage', {
            message: analytics
        });

        var currentFileNameArray = imageName.split('_').join(',').split('.').join(',').split(',');
        var currentImageTimestamp = currentFileNameArray[2];
        for (var key of resultMap.keys()) {
            var filenameKeys = key.split('_').join(',').split('.').join(',').split(',');
            var mapFileTimestamp = filenameKeys[2];
            if (key.startsWith(analytics.camId) && mapFileTimestamp < currentImageTimestamp && key !== imageName) {
                resultMap.delete(key);
            }
        }

        /** Remove result from resultMap*/
        resultMap.delete(req.body.imgName);
    }
    else {
        imageMap.set(req.body.imgName, req.body.imgBase64);
    }

    logger.debug("%s : Sending Success response of getImage function.", logStr);
    res.status(constants.httpStatusCodes.success).send({ 'message': 'success' });
};

var getDetectionCountByFeature = function (req, res) {
    resultDao.getDetectionCountByFeature(req, res);
}

var getDetectionCountByCameras = function (req, res) {
    var reqBody = req.body;
    if (reqBody.length === 0) {
        errorHandler('UnprocessableEntity', res);
    }
    resultDao.getDetectionCountByCameras(req, res);
}

var getBoundingBox = function (camId, res) {
    cameraDao.getCamerasByCameraId(camId, function (error, result) {
        if (error) {
            logger.error("%s : Error in getCamerasByCameraId function : ", logStr, error);
            errorHandler(error, res);
            return;
        }
        var boundingBoxes = result[0].boundingBox;
        var markerNameArray = [];
        boundingBoxes.forEach(function (bbox, index) {
            markerNameArray.push(bbox.markerName);
            if (index === boundingBoxes.length - 1) {
                var response = {
                    'deviceName': result[0].deviceName,
                    'markerNames': markerNameArray
                }
                res.status(constants.httpStatusCodes.success).send(response);
                return;
            }
        });
    });
}

var getCameras = function (cameras, res) {
    camIdArray = [];
    cameras.forEach(function (camera, index) {
        camIdArray.push(camera.camId);
        if (index === cameras.length - 1) {
            cameraDao.getCamerasByCameraId(camIdArray, function (error, result) {
                if (error) {
                    logger.error("%s : Error in getCamerasByCameraId function : ", logStr, error);
                    errorHandler(error, res);
                    return;
                }
                var cameraArray = [];
                result.forEach(function (camera, index) {
                    cameraArray.push(camera.deviceName);
                    if (index === result.length - 1) {
                        var response = { 'cameras': cameraArray };
                        res.status(constants.httpStatusCodes.success).send(response);
                        return;
                    }
                });
            });
        }
    });
}

/** This function will maintain details of selected cameras or markers for live dashboard */
var getLiveCameraResults = function (req, res) {
    logger.debug("%s : In getLiveCameraResults function. Received request : " + JSON.stringify(req.body), logStr);
    if (req.body.flag === 1) {
        var timestamp = req.body.timestamp;
        var userId = req.headers['userid'];
        var cameraArray = req.body.cameras;
        liveCameraResultMap.clear();
        var filter = req.body.filter;
        if (filter === 'camera') {
            cameraArray.forEach(function (camera, index) {
                var liveDashboardReq = {
                    'userId': userId,
                    'filter': req.body.filter
                }
                liveCameraResultMap.set(camera.camId, liveDashboardReq);
            });
            if (cameraArray.length === 1) {
                getBoundingBox(req.body.cameras[0].camId, res);
                return;
            }
            else {
                getCameras(req.body.cameras, res);
                return;
            }
        }
        else if (filter === 'marker') {
            var markerNames = [];
            cameraArray.forEach(function (camera, index) {
                var liveDashboardReq = {
                    'userId': userId,
                    'filter': req.body.filter,
                    'markerName': camera.itemName
                }
                var markerNameArray = [];
                if (liveCameraResultMap.has(camera.camId)) {
                    var markerNameArray = liveCameraResultMap.get(camera.camId);
                }
                markerNameArray.push(liveDashboardReq);
                liveCameraResultMap.set(camera.camId, markerNameArray);
                markerNames.push(camera.itemName);

                if (index === cameraArray.length - 1) {
                    res.status(constants.httpStatusCodes.success).send(markerNames);
                    return;
                }
            });
        }
        else {
            errorHandler('UnprocessableEntity', res);
            return;
        }
    }
    else {
        liveCameraResultMap.clear();
        res.status(constants.httpStatusCodes.success).send({ 'message': 'success' });
    }
}

exports.getResult = getResult;
exports.getImage = getImage;
exports.getDetectionCountByFeature = getDetectionCountByFeature;
exports.getDetectionCountByCameras = getDetectionCountByCameras;
exports.getLiveCameraResults = getLiveCameraResults;