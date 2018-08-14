var videoRetentionController = require('../controller/videoRetentionController');

module.exports = function (app) {
    app.post('/devices/videos/retention', videoRetentionController.saveVideoRetention);
    app.get('/videos/retention/cameras', videoRetentionController.getRetentionCameras);
    app.get('/videos/retention', videoRetentionController.getVideoRetentionDetails);
    app.delete('/videos/retention/all', videoRetentionController.deleteVideoByDate);
    app.delete('/videos/retention/:id' ,videoRetentionController.deleteVideoRetentionDetails);
};