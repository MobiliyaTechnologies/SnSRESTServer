var faceRecognitionController = require('../controller/faceRecognitionController');

module.exports = function (app) {
    app.post('/faces', faceRecognitionController.addFaceList);
    app.put('/faces/:id', faceRecognitionController.updateFaceList);
    app.get('/faces/count', faceRecognitionController.getTotalCountOffaces);
    app.get('/faces', faceRecognitionController.getFaceList);
    app.delete('/faces', faceRecognitionController.removeFaces);
    app.get('/devices/faces', faceRecognitionController.getFaceList);
    app.delete('/faces/all', faceRecognitionController.removeAllFaces);
};