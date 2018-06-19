var videoIndexingController = require('../controller/videoIndexingController');

module.exports = function (app) {
    app.post('/videos', videoIndexingController.saveVideoIndex);
    app.post('/devices/videos', videoIndexingController.updateVideoIndex);
    app.get('/videos', videoIndexingController.getVideoIndex);
    app.get('/widgets',videoIndexingController.getVideoWidgetUrls);
    app.delete('/video', videoIndexingController.removeVideoById);
};