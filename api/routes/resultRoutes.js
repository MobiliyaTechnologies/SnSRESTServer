var resultController = require('../controller/resultController');

module.exports = function(app)
{
 app.post('/results', resultController.getResult);
 app.post('/images', resultController.getImage);
 app.get('/analytics/results/features',resultController.getDetectionCountByFeature);
 app.post('/analytics/results/cameras', resultController.getDetectionCountByCameras);
 app.post('/analytics/results/live', resultController.getLiveCameraResults);
};