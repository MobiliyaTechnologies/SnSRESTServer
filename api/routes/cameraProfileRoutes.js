var cameraProfileController = require('../controller/cameraProfileController');

module.exports = function (app) {
    app.get('/profiles/cameras', cameraProfileController.getCameraProfile);
};