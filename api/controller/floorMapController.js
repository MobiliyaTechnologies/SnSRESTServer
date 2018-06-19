var fs = require('fs');
var floorMapDao = require('../dao/floorMapDao');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;
var constants = require('../config/constants');
var config = require('../../settings');

var createFloorMap = function (req, res) {
    req.query.mapName = req.body.name;
    floorMapDao.getFloorMapByName(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (result) {
            errorHandler('DuplicateDataError', res);
            return;
        }
        //save floor map
        var imageData = req.body.base64;
        var base64Data  =   imageData.replace(/^data:image\/jpeg;base64,/, "");
        base64Data  +=  base64Data.replace('+', ' ');
        var binaryData  =   new Buffer(base64Data, 'base64').toString('binary');
        var imagePath = constants.floorMapImagePath + req.body.name + '.jpg';
        fs.writeFile(imagePath, binaryData, 'binary', function(err, result) {
            if(error){
                errorHandler(error, res);
                return;
            }
            req.body.imagePath = config.hostname + '/' + req.body.name + '.jpg';
            floorMapDao.createFloorMap(req, res);
          });
    });
};

var updateFloorMap = function (req, res) {
    if (!req.body.name) {
        floorMapDao.updateFloorMap(req, res);
        return;
    }
    req.query.mapName = req.body.name;
    floorMapDao.getFloorMapByName(req, function (error, result) {
        if (error) {
            errorHandler(error, res);
            return;
        }
        if (result) {
            errorHandler('DuplicateDataError', res);
            return;
        }
        floorMapDao.updateFloorMap(req, res);
    });
};

var getFloorMap = function (req, res) {
    floorMapDao.getFloorMap(req, function (error, result) {
        var maps = result;
        var resposne = [];
        if(maps.length === 0){
            res.status(constants.httpStatusCodes.success).send(result);
            return;
        }
        maps.forEach(function (map, index) {
            var cameras = map.cameras;
            if (cameras.length === 0) {
                resposne.push(map);
            }
            else {  
                var resMap = {
                    '_id': map._id,
                    'name': map.name,
                    'location': map.location,
                    'base64': map.base64,
                    'createdAt': map.createdAt
                }
                var resCameras = [];
                cameras.forEach(function (camera, camIndex) {
                    if (camera.isDeleted === 0) {
                        resCameras.push(camera);
                    }
                    if (camIndex === cameras.length - 1) {
                        resMap.cameras = resCameras;
                        resposne.push(resMap);
                    }
                });
            }
            if (index === maps.length - 1) {
                res.status(constants.httpStatusCodes.success).send(resposne);
            }
        });
    });
};

var deleteMap = function (req, res) {
    floorMapDao.deleteMap(req, res);
}

var findAndRemoveCameraOnMap = function (camId, callback) {
    floorMapDao.findCameraOnMap(camId, function (error, result) {
        if (error) {
            callback(error, null);
        }
        if(! result){
            callback(null, {'message': 'success'});
        }
        else {
            var mapId = result._id;
            var cameras = result.cameras;
            var camIdArray = [];
            cameras.forEach(function (camera, index) {
                if (camera.camId === camId) {
                    camera.isDeleted = 1;
                    camIdArray.push(camera);
                }
                else{
                    camIdArray.push(camera);
                }
                if (index === cameras.length - 1) {
                    floorMapDao.removeCameraOnMap(mapId, camIdArray, function (error, result) {
                        if (error) {
                            callback(error, null);
                        }
                        else {
                            callback(null, result);
                        }
                    });
                }
            });
        }
    });
}

exports.createFloorMap = createFloorMap;
exports.updateFloorMap = updateFloorMap;
exports.getFloorMap = getFloorMap;
exports.deleteMap = deleteMap;
exports.findAndRemoveCameraOnMap = findAndRemoveCameraOnMap;