var cameraProfileDao = require('../dao/cameraProfileDao');
var errorHandler = require('../errorHandler/errorHandler').errorHandler;

var registerCameraProfile = function (req) {
    cameraProfileDao.registerCameraProfile(req);
}

var getCameraProfile = function (req, res) {
    if (!req.query.camIds) {
        errorHandler('UnprocessableEntity', res);
        return;
    }
    cameraProfileDao.getCameraProfile(req, res);
}

exports.registerCameraProfile = registerCameraProfile;
exports.getCameraProfile = getCameraProfile;