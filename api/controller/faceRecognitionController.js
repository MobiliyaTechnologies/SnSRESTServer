var async = require('async');
var azure = require('azure-storage');
var Readable = require('stream').Readable;
var fs = require('fs');
var faceRecognitionDao = require('../dao/faceRecognitionDao');
var constants = require('../config/constants');
var request = require('request');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var server = require('../../server');
var logger = require('../logger/index').logger;
var logStr = 'FaceRecognitionController';

var blobService = azure.createBlobService(constants.blobStorage.blobStorageAccountName, constants.blobStorage.blobStorageAccessKey, constants.blobStorage.blobUri);

/** Add face list */
var addFaceList = function (req, res) {
    logger.debug("%s : In addFaceList function", logStr);
    var body = req.body;
    req.params = {};
    req.params.id = req.body.faceId;
    faceRecognitionDao.getFaceListById(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (!result) {
            errorHandler('FaceNotFoundError', res);
            return;
        }
        else {
            /** Downlaod user image */
            addFacesToList(req, res, result);
        }
    });
}

function addFacesToList(req, res, result) {
    logger.debug("%s : In addFacesToList function: " + req.body.userData, logStr);
    var userData = req.body.userData;
    var rect = result.faceRectangle;

    var baseFaceUrl = constants.faceApiConfig.freeFaceApiBaseUrl;
    var faceApiSubscriptionKey = constants.faceApiConfig.freeFaceApiSubscriptionKey;
    if(server.facePricingTier){
        baseFaceUrl = constants.faceApiConfig.standardFaceApiBaseUrl;
        faceApiSubscriptionKey = constants.faceApiConfig.standardFaceApiSubscriptionKey;
    }
    
    var headers = {
        'Ocp-Apim-Subscription-Key': faceApiSubscriptionKey,
        'Content-Type': constants.faceApiConfig.faceApiContentTypeHeader
    }

    var reqBody = {
        'url': result.imgUrl
    }

    var optionsFaceApi = {
        url: baseFaceUrl + '?userData=' + userData + '&targetFace=' + rect.left + ',' + rect.top + ',' + rect.width + ',' + rect.height,
        method: constants.faceApiConfig.faceApiMethodType,
        headers: headers,
        body: JSON.stringify(reqBody)
    }

    request(optionsFaceApi, function (error, response, body) {
        logger.debug("%s : Received success response from face API", logStr);
        if (response && response.statusCode === constants.httpStatusCodes.success) {
            body = JSON.parse(body.toString());
            var faceReq = {};
            faceReq.params = {};
            faceReq.params.id = req.body.faceId;
            faceReq.body = {
                persistedFaceId: body.persistedFaceId,
                userData: userData,
                age: req.body.age,
                gender: req.body.gender,
                status: 1,
                flag : req.body.flag
            };
            faceRecognitionDao.updateFaceList(faceReq, function (error, result) {
                if (error) {
                    errorHandler(error, res);
                    return;
                }
                if (!result) {
                    errorHandler('FaceNotFoundError', res);
                    return;
                }
                res.status(constants.httpStatusCodes.success).send({ 'result': 'User Added to the face list' });
            });
        }
        else {
            logger.error("Error in AddFaceAPI", logStr, JSON.parse(body));
            res.status(constants.httpStatusCodes.internalError).send({'message': 'Error adding face to face list'});
        }
   });
}

/** Get face list */
var getFaceList = function (req, res) {
    faceRecognitionDao.getFaceList(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        res.status(constants.httpStatusCodes.success).send(result);
    });
}

/** Remove face details */
var removeFaces = function (req, res) {
    if (!req.query.faceIds) {
        errorHandler('UnprocessableEntity', res);
        return;
    }
    faceRecognitionDao.getFaceListByArray(req.query.faceIds, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        /** Remove from database */
        faceRecognitionDao.removeFaces(req, res);

        /**Remove from blob and facelist */
        result.forEach(function(item){
            var imgUrl = item.imgUrl;
            var persistedFaceId = item.persistedFaceId;
            /**Remove from Blob */
            removeFaceFromBlob(imgUrl);

            if(item.status === 1){
                /**If identified face then remove from face list */
                removeFaceFromFaceList(persistedFaceId);
            }
        });
    });
}

/**Remove Face from blob */
removeFaceFromBlob = function(imgUrl){
    var imageName = imgUrl.split('/');
    blobService.deleteBlobIfExists(constants.blobStorage.blobContainerName, imageName[4], function (error, result, response) {
        if (error) {
            logger.error("%s: Error while deleting blob: "+ imgUrl, logStr, error);
            return;
        } else {
            if (response.statusCode == constants.httpStatusCodes.requestAccepted) {
                logger.debug("%s: Blob deleted "+ imgUrl, logStr);
                return;
            }
            else {
                logger.error("%s: Error while deleting blob: "+ imgUrl, logStr);
                return;
            }
        }
    });
}

/**Remove from face list */
var removeFaceFromFaceList = function(persistedFaceId){
    var baseFaceUrl = constants.faceApiConfig.freeFaceApiBaseUrl;
    var faceApiSubscriptionKey = constants.faceApiConfig.freeFaceApiSubscriptionKey;
    if(server.facePricingTier){
        baseFaceUrl = constants.faceApiConfig.standardFaceApiBaseUrl;
        faceApiSubscriptionKey = constants.faceApiConfig.standardFaceApiSubscriptionKey;
    }

    var headers = {
        'Ocp-Apim-Subscription-Key': faceApiSubscriptionKey,
        'Content-Type': constants.faceApiConfig.faceApiContentTypeHeader
    }

    var optionsFaceApi = {
        url: baseFaceUrl + '/' + persistedFaceId,
        method: constants.faceApiConfig.removeFaceAPIMethodType,
        headers: headers
    }

    request(optionsFaceApi, function (error, response, body) {
        if(error){
            logger.error("%s: Error while remove face from face list", logStr, error);
            return;
        }
        else if(response && response.statusCode === constants.httpStatusCodes.success){
            logger.debug("%s: Face removed from face list", logStr);
            return;
        }
        else{
            logger.error("%s: Error while remove face from face list", logStr);
            return;
        }
    });
}

/** Update face details */
var updateFaceList = function (req, res) {
    faceRecognitionDao.updateFaceList(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        res.status(constants.httpStatusCodes.success).send(result);
    });
}

var getTotalCountOffaces = function (req, res) {
    faceRecognitionDao.getTotalCountOffaces(req, res);
}

/**Remove all faces from database and blob by status, 
 * if status is not provided, then default unidentfied faces will be deleted*/
var removeAllFaces = function (req, res) {
    faceRecognitionDao.getFaceListByStatus(req.query.status,function(error, result){
        if(error){
            errorHandler(error, res);
            return;
        }
        if(!result){
            errorHandler('FaceNotFoundError', res);
            return;
        }
        /** Remove faces from database */
        faceRecognitionDao.removeAllFaces(req, res);
        result.forEach(function(face){
            var imgUrl = face.imgUrl;
            /** Remove From Blob */
            removeFaceFromBlob(imgUrl);

            if(face.status === 1){
                removeFaceFromFaceList(face.persistedFaceId);
            }
        });
    });
}

exports.addFaceList = addFaceList;
exports.getFaceList = getFaceList;
exports.removeFaces = removeFaces;
exports.updateFaceList = updateFaceList;
exports.getTotalCountOffaces = getTotalCountOffaces;
exports.removeAllFaces = removeAllFaces;