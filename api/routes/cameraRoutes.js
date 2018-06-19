var cameraController = require('../controller/cameraController');
var cameraDao = require('../dao/cameraDao');

module.exports = function (app) {
    app.post('/cameras', cameraController.validateCamera);
    app.get('/cameras', cameraController.retrieveCamera);
    app.get('/cameras/markers', cameraController.validateMarker);
    app.get('/cameras/bboxes', cameraController.getAllBoundingBoxes);
    app.get('/cameras/:id', cameraController.getCameraById);
    app.delete('/cameras/:id', cameraController.deleteCamera);
    app.post('/cameras/raw', cameraController.getRawImage);
    app.put('/cameras/aoi', cameraController.setBoundingBox);
    app.put('/cameras/status', cameraController.startStopCamera);
    app.put('/cameras/plot', cameraController.plotCameras);
    app.put('/cameras/:id', cameraController.updateCamera);
    app.get('/analytics/cameras/features',cameraController.getLiveCameraCountByFeature);
    app.get('/analytics/cameras/list', cameraController.getCamerasByAggregators);
    app.post('/cameras/toggle/streaming', cameraController.toggleStreaming);
    app.get('/devices/cameras', cameraController.getCameraDetailsByName);
    app.post('/devices/cameras/raw', cameraController.sendRawImage);
    app.post('/devices/cameras/response', cameraController.addCamera);
};